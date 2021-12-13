use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    system_program,
};
use anchor_spl::token::{
    self, transfer, close_account, TokenAccount, Transfer, CloseAccount, Token, Mint
};
use anchor_spl::associated_token::{
    self, AssociatedToken,
};

declare_id!("vXXYKPPwmERsfQPKEwhmnQBABVDoLUKRzz5LtLk9ndS");

const ADMIN_WHITELIST_MAX_LEN: usize = 16;

#[program]
pub mod vibe_market {
    use super::*;
    pub fn init_global_state(ctx: Context<InitGlobalState>, nonce: u8) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        global_state.nonce = nonce;
        Ok(())
    }

    pub fn init_market(ctx: Context<InitMarket>, nonce: u8, whitelist: Vec<Pubkey>, title: String) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        let market = &mut ctx.accounts.market;
        market.index = global_state.num_markets;

        global_state.num_markets = global_state
            .num_markets
            .checked_add(1)
            .ok_or_else(|| ErrorCode::Overflow)?;
        
        market.whitelist = whitelist;
        market.nonce = nonce;
        market.title = title;

        if market.whitelist.len() > ADMIN_WHITELIST_MAX_LEN {
            return Err(ErrorCode::AdminOutOfBounds.into());
        }

        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn add_admin(ctx: Context<AddAdmin>) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        market.whitelist.push(ctx.accounts.add_admin.key());

        if market.whitelist.len() > ADMIN_WHITELIST_MAX_LEN {
            return Err(ErrorCode::AdminOutOfBounds.into());
        }

        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn remove_admin(ctx: Context<RemoveAdmin>) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        let remove_admin_key = &ctx.accounts.remove_admin.key();

        if ctx.accounts.admin.key() == *remove_admin_key {
            return Err(ErrorCode::CannotRemoveSelf.into());
        };
        if !market.whitelist.contains(remove_admin_key) {
            return Err(ErrorCode::AdminNotFound.into());
        };

        market.whitelist = market.whitelist.clone().into_iter()
            .filter(|p| p != remove_admin_key).collect();

        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn init_collection(
        ctx: Context<InitCollection>,
        collection_nonce: u8,
        list_head_nonce: u8,
        list_tail_nonce: u8,
        title: String,
    ) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        let collection = &mut ctx.accounts.collection;
        collection.index = market.num_collections;

        market.num_collections = market
            .num_collections
            .checked_add(1)
            .ok_or_else(|| ErrorCode::Overflow)?;

        collection.nonce = collection_nonce;
        collection.title = title;
        collection.list_head = ctx.accounts.list_head.to_account_info().key();
        collection.list_tail = ctx.accounts.list_tail.to_account_info().key();

        let list_head = &mut ctx.accounts.list_head;
        list_head.nonce = list_head_nonce;
        list_head.payer = ctx.accounts.admin.key();
        list_head.next_list_item = ctx.accounts.list_tail.to_account_info().key();

        let list_tail = &mut ctx.accounts.list_tail;
        list_tail.nonce = list_tail_nonce;
        list_tail.payer = ctx.accounts.admin.key();
        list_tail.prev_list_item = ctx.accounts.list_head.to_account_info().key();

        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn init_price_model(
        ctx: Context<InitPriceModel>,
        nonce: u8,
        sale_prices: Vec<SalePrice>,
    ) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        let price_model = &mut ctx.accounts.price_model;
        price_model.index = market.num_price_models;

        market.num_price_models = market
            .num_price_models
            .checked_add(1)
            .ok_or_else(|| ErrorCode::Overflow)?;

        price_model.nonce = nonce;
        price_model.sale_prices = sale_prices;
        price_model.market = market.to_account_info().key();

        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn add_nft(
        ctx: Context<AddNft>,
    ) -> ProgramResult {
        let list_head = &mut ctx.accounts.list_head;
        list_head.next_list_item = ctx.accounts.new_item.to_account_info().key();

        let next_list_item = &mut ctx.accounts.next_list_item;
        next_list_item.prev_list_item = ctx.accounts.new_item.to_account_info().key();

        let new_item = &mut ctx.accounts.new_item;
        new_item.nft_mint = ctx.accounts.admin_nft_mint.to_account_info().key();
        new_item.price_model = ctx.accounts.price_model.to_account_info().key();
        new_item.prev_list_item = ctx.accounts.list_head.to_account_info().key();
        new_item.next_list_item = ctx.accounts.next_list_item.to_account_info().key();
        new_item.payer = ctx.accounts.admin.key();
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.admin_nft_account.to_account_info(),
            to: ctx.accounts.program_nft_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, 1)?;

        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn withdraw_nft(
        ctx: Context<WithdrawNft>,
    ) -> ProgramResult {
        // Transfer NFT
        let market = &ctx.accounts.market;
        let collection = &ctx.accounts.collection;

        let seeds = &[
            market.to_account_info().key.as_ref(),
            &collection.index.to_le_bytes(),
            b"collection".as_ref(),
            &[collection.nonce],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.program_nft_account.to_account_info(),
            to: ctx.accounts.admin_nft_account.to_account_info(),
            authority: ctx.accounts.collection.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        transfer(cpi_ctx, 1)?;

        // Close NFT token account
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = CloseAccount {
            account: ctx.accounts.program_nft_account.to_account_info(),
            destination: ctx.accounts.rent_refund.to_account_info(),
            authority: ctx.accounts.collection.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        close_account(cpi_ctx)?;

        // Remove item from linked-list
        let prev_list_item = &mut ctx.accounts.prev_list_item;
        let next_list_item = &mut ctx.accounts.next_list_item;
        prev_list_item.next_list_item = next_list_item.to_account_info().key();
        next_list_item.prev_list_item = prev_list_item.to_account_info().key();

        Ok(())
    }

    pub fn purchase_nft(
        ctx: Context<PurchaseNft>,
    ) -> ProgramResult {
        let price_model = &ctx.accounts.price_model;
        let debit_mint = &ctx.accounts.debit_mint;

        // Check debit mint
        let sale_price_option = price_model.sale_prices.iter().find(|sp| sp.mint == debit_mint.key());
        let sale_price = match sale_price_option {
            Some(sale_price) => sale_price,
            None => return Err(ErrorCode::InvalidPurchaseMint.into())
        };

        // Collect payment
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.debit_account.to_account_info(),
            to: ctx.accounts.program_credit_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, sale_price.amount)?;

        // Transfer NFT
        let market = &ctx.accounts.market;
        let collection = &ctx.accounts.collection;

        let seeds = &[
            market.to_account_info().key.as_ref(),
            &collection.index.to_le_bytes(),
            b"collection".as_ref(),
            &[collection.nonce],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.program_nft_account.to_account_info(),
            to: ctx.accounts.owner_nft_account.to_account_info(),
            authority: ctx.accounts.collection.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        transfer(cpi_ctx, 1)?;

        // Close NFT token account
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = CloseAccount {
            account: ctx.accounts.program_nft_account.to_account_info(),
            destination: ctx.accounts.rent_refund.to_account_info(),
            authority: ctx.accounts.collection.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        close_account(cpi_ctx)?;

        // Remove item from linked-list
        let prev_list_item = &mut ctx.accounts.prev_list_item;
        let next_list_item = &mut ctx.accounts.next_list_item;
        prev_list_item.next_list_item = next_list_item.to_account_info().key();
        next_list_item.prev_list_item = prev_list_item.to_account_info().key();

        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn withdraw_liquidity(
        ctx: Context<WithdrawLiquidity>, amount: u64
    ) -> ProgramResult {
        let market = &ctx.accounts.market;
        let global_state_key = ctx.accounts.global_state.to_account_info().key();
        let seeds = &[
            global_state_key.as_ref(),
            &market.index.to_le_bytes(),
            &[market.nonce],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.program_debit_account.to_account_info(),
            to: ctx.accounts.admin_credit_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn close_collection(ctx: Context<CloseCollection>) -> ProgramResult {
        let list_head = &ctx.accounts.list_head;
        let list_tail = &ctx.accounts.list_tail;
        if list_head.next_list_item != list_tail.to_account_info().key() ||
        list_tail.prev_list_item != list_head.to_account_info().key() {
            return Err(ErrorCode::CollectionNonEmpty.into());
        }
        Ok(())
    }
}

/************************/
/* INSTRUCTION ACCOUNTS */
/************************/

#[derive(Accounts)]
#[instruction(
    nonce: u8
)]
pub struct InitGlobalState<'info> {
    admin: Signer<'info>,
    #[account(
        init,
        seeds = [
            b"global".as_ref(),
        ],
        bump = nonce,
        payer = admin,
    )]
    global_state: Account<'info, GlobalState>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    nonce: u8,
    whitelist: Vec<Pubkey>,
    title: String,
)]
pub struct InitMarket<'info> {
    admin: Signer<'info>,
    #[account(mut)]
    global_state: Account<'info, GlobalState>,
    #[account(
        init,
        seeds = [
            global_state.to_account_info().key.as_ref(),
            &global_state.num_markets.to_le_bytes(),
        ],
        bump = nonce,
        payer = admin,
        space = Market::LEN
    )]
    market: Account<'info, Market>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddAdmin<'info> {
    admin: Signer<'info>,
    #[account(mut)]
    market: Account<'info, Market>,
    add_admin: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RemoveAdmin<'info> {
    admin: Signer<'info>,
    #[account(mut)]
    market: Account<'info, Market>,
    remove_admin: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(
    collection_nonce: u8,
    list_head_nonce: u8,
    list_tail_nonce: u8,
    title: String,
)]
pub struct InitCollection<'info> {
    admin: Signer<'info>,
    #[account(mut)]
    market: Account<'info, Market>,
    #[account(
        init,
        seeds = [
            market.to_account_info().key.as_ref(),
            &market.num_collections.to_le_bytes(),
            b"collection".as_ref(),
        ],
        bump = collection_nonce,
        payer = admin,
        space = Collection::LEN
    )]
    collection: Account<'info, Collection>,
    #[account(
        init,
        seeds = [
            collection.to_account_info().key.as_ref(),
            b"head".as_ref(),
        ],
        bump = list_head_nonce,
        payer = admin,
        space = NftBucket::LEN
    )]
    list_head: Account<'info, NftBucket>,
    #[account(
        init,
        seeds = [
            collection.to_account_info().key.as_ref(),
            b"tail".as_ref(),
        ],
        bump = list_tail_nonce,
        payer = admin,
        space = NftBucket::LEN
    )]
    list_tail: Account<'info, NftBucket>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    nonce: u8,
)]
pub struct InitPriceModel<'info> {
    admin: Signer<'info>,
    #[account(mut)]
    market: Account<'info, Market>,
    #[account(
        init,
        seeds = [
            market.to_account_info().key.as_ref(),
            &market.num_price_models.to_le_bytes(),
            b"price_model".as_ref(),
        ],
        bump = nonce,
        payer = admin,
        space = PriceModel::LEN
    )]
    price_model: Account<'info, PriceModel>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddNft<'info> {
    admin: Signer<'info>,
    market: Box<Account<'info, Market>>,
    #[account(
        seeds = [
            market.to_account_info().key.as_ref(),
            &collection.index.to_le_bytes(),
            b"collection".as_ref(),
        ],
        bump = collection.nonce,
    )]
    collection: Box<Account<'info, Collection>>,
    #[account(mut)]
    list_head: Box<Account<'info, NftBucket>>,
    #[account(
        mut,
        address = list_head.next_list_item
    )]
    next_list_item: Box<Account<'info, NftBucket>>,
    #[account(
        init,
        payer = admin,
        space = NftBucket::LEN
    )]
    new_item: Box<Account<'info, NftBucket>>,
    #[account(
        seeds = [
            market.to_account_info().key.as_ref(),
            &price_model.index.to_le_bytes(),
            b"price_model".as_ref(),
        ],
        bump = price_model.nonce,
    )]
    price_model: Box<Account<'info, PriceModel>>,
    #[account(mut)]
    admin_nft_account: Box<Account<'info, TokenAccount>>,
    #[account(address = admin_nft_account.mint)]
    admin_nft_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = admin,
	    associated_token::mint = admin_nft_mint,
        associated_token::authority = collection,
    )]
    program_nft_account: Box<Account<'info, TokenAccount>>,
    #[account(address = associated_token::ID)]
    associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = token::ID)]
    token_program: Program<'info, Token>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawNft<'info> {
    admin: Signer<'info>,
    #[account(mut, address = withdraw_list_item.payer)]
    rent_refund: UncheckedAccount<'info>,
    #[account(address = withdraw_list_item.price_model)]
    price_model: Box<Account<'info, PriceModel>>,
    #[account(address = price_model.market)]
    market: Box<Account<'info, Market>>,
    #[account(
        seeds = [
            market.to_account_info().key.as_ref(),
            &collection.index.to_le_bytes(),
            b"collection".as_ref(),
        ],
        bump = collection.nonce,
    )]
    collection: Box<Account<'info, Collection>>,
    #[account(mut, close = rent_refund)]
    withdraw_list_item: Box<Account<'info, NftBucket>>,
    #[account(
        mut,
	    associated_token::mint = withdraw_list_item.nft_mint,
        associated_token::authority = collection,
    )]
    program_nft_account: Box<Account<'info, TokenAccount>>,
    #[account(address = withdraw_list_item.nft_mint)]
    program_nft_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = admin,
	    associated_token::mint = program_nft_mint,
        associated_token::authority = admin,
    )]
    admin_nft_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = withdraw_list_item.prev_list_item
    )]
    prev_list_item: Account<'info, NftBucket>,
    #[account(
        mut,
        address = withdraw_list_item.next_list_item
    )]
    next_list_item: Account<'info, NftBucket>,
    #[account(address = associated_token::ID)]
    associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = token::ID)]
    token_program: Program<'info, Token>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PurchaseNft<'info> {
    owner: Signer<'info>,
    #[account(mut, address = purchase_list_item.payer)]
    rent_refund: UncheckedAccount<'info>,
    #[account(address = purchase_list_item.price_model)]
    price_model: Box<Account<'info, PriceModel>>,
    #[account(address = price_model.market)]
    market: Box<Account<'info, Market>>,
    #[account(
        seeds = [
            market.to_account_info().key.as_ref(),
            &collection.index.to_le_bytes(),
            b"collection".as_ref(),
        ],
        bump = collection.nonce,
    )]
    collection: Box<Account<'info, Collection>>,
    #[account(mut, close = rent_refund)]
    purchase_list_item: Box<Account<'info, NftBucket>>,
    #[account(address = debit_account.mint)]
    debit_mint: Box<Account<'info, Mint>>,
    #[account(mut, has_one = owner)]
    debit_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = owner,
	    associated_token::mint = debit_mint,
        associated_token::authority = market,
    )]
    program_credit_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
	    associated_token::mint = purchase_list_item.nft_mint,
        associated_token::authority = collection,
    )]
    program_nft_account: Box<Account<'info, TokenAccount>>,
    #[account(address = purchase_list_item.nft_mint)]
    program_nft_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = owner,
	    associated_token::mint = program_nft_mint,
        associated_token::authority = owner,
    )]
    owner_nft_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = purchase_list_item.prev_list_item
    )]
    prev_list_item: Account<'info, NftBucket>,
    #[account(
        mut,
        address = purchase_list_item.next_list_item
    )]
    next_list_item: Account<'info, NftBucket>,
    #[account(address = associated_token::ID)]
    associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = token::ID)]
    token_program: Program<'info, Token>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    admin: Signer<'info>,
    #[account(
        seeds = [
            b"global".as_ref(),
        ],
        bump = global_state.nonce,
    )]
    global_state: Box<Account<'info, GlobalState>>,
    #[account(
        seeds = [
            global_state.to_account_info().key.as_ref(),
            &market.index.to_le_bytes(),
        ],
        bump = market.nonce,
    )]
    market: Box<Account<'info, Market>>,
    withdraw_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
	    associated_token::mint = withdraw_mint,
        associated_token::authority = market,
    )]
    program_debit_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = admin,
	    associated_token::mint = withdraw_mint,
        associated_token::authority = admin,
    )]
    admin_credit_account: Box<Account<'info, TokenAccount>>,
    #[account(address = associated_token::ID)]
    associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = token::ID)]
    token_program: Program<'info, Token>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CloseCollection<'info> {
    admin: Signer<'info>,
    market: Box<Account<'info, Market>>,
    #[account(address = list_head.payer)]
    rent_refund: Signer<'info>,
    #[account(
        mut,
        seeds = [
            market.to_account_info().key.as_ref(),
            &collection.index.to_le_bytes(),
            b"collection".as_ref(),
        ],
        bump = collection.nonce,
        close = rent_refund
    )]
    collection: Account<'info, Collection>,
    #[account(
        mut,
        address = collection.list_head,
        close = rent_refund
    )]
    list_head: Account<'info, NftBucket>,
    #[account(
        mut,
        address = collection.list_tail,
        close = rent_refund
    )]
    list_tail: Account<'info, NftBucket>,
}

/*******************/
/* DATA STRUCTURES */
/*******************/

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub nonce: u8,
    pub num_markets: u32,
}

#[account]
pub struct Market {
    pub nonce: u8,
    pub index: u32,
    pub whitelist: Vec<Pubkey>,
    pub num_collections: u32,
    pub num_price_models: u32,
    pub title: String,
}

impl Market {
    pub const LEN: usize = 575;

    fn is_valid_admin(market: &Market, admin: &Pubkey) -> Result<()> {
        if !market.whitelist.contains(&admin) {
            return Err(ErrorCode::Unauthorized.into());
        };
        return Ok(())
    }
}

impl Default for Market {
    fn default() -> Self {
        Market {
            nonce: 0,
            index: 0,
            whitelist: vec![
                Pubkey::default();
                ADMIN_WHITELIST_MAX_LEN
            ],
            num_collections: 0,
            num_price_models: 0,
            title: String::with_capacity(32),
        }
    }
}

#[account]
pub struct Collection {
    pub nonce: u8,
    pub index: u32,
    pub list_head: Pubkey,
    pub list_tail: Pubkey,
    pub title: String,
}

impl Collection {
    pub const LEN: usize = 115;
}

impl Default for Collection {
    fn default() -> Self {
        Collection {
            nonce: 0,
            index: 0,
            list_head: Pubkey::default(),
            list_tail: Pubkey::default(),
            title: String::with_capacity(32),
        }
    }
}

#[account]
#[derive(Default)]
pub struct NftBucket {
    pub nonce: u8,
    pub nft_mint: Pubkey,
    pub price_model: Pubkey,
    pub prev_list_item: Pubkey,
    pub next_list_item: Pubkey,
    pub payer: Pubkey,
}

impl NftBucket {
    pub const LEN: usize = 169;
}

#[account]
pub struct PriceModel {
    pub nonce: u8,
    pub index: u32,
    pub market: Pubkey,
    pub sale_prices: Vec<SalePrice>,
}

impl PriceModel {
    pub const LEN: usize = 370;
}

impl Default for PriceModel {
    fn default() -> Self {
        PriceModel {
            nonce: 0,
            index: 0,
            market: Pubkey::default(),
            sale_prices: vec![
                SalePrice {
                    mint: Pubkey::default(),
                    amount: 0,
                };
                8
            ],
        }
    }
}

#[derive(
    AnchorSerialize,
    AnchorDeserialize,
    Clone,
)]
pub struct SalePrice {
    pub mint: Pubkey,
    pub amount: u64,
}

#[error]
pub enum ErrorCode {
    #[msg("Instruction invoked without a valid admin.")]
    Unauthorized,
    #[msg("Signing account cannot remove itself.")]
    CannotRemoveSelf,
    #[msg("Cannot purchase from selected collection with specified Mint.")]
    InvalidPurchaseMint,
    #[msg("Overflow when applying an arithmetic operation.")]
    Overflow,
    #[msg("Admin address was not found in market whitelist.")]
    AdminNotFound,
    #[msg("Admin whitelist exceeded max length of 16.")]
    AdminOutOfBounds,
    #[msg("Collections cannot be closed until all NFTs are removed.")]
    CollectionNonEmpty,
}