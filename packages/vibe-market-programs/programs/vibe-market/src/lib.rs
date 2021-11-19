use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    system_program,
};
use anchor_spl::token::{
    self, transfer, TokenAccount, Transfer, Token, Mint
};
use anchor_spl::associated_token::{
    self, AssociatedToken,
};

declare_id!("A3RM1Z9JW6JiTNheD4JcjnE9qLGLk9phgv8GfszEyE8L");

#[program]
pub mod vibe_market {
    use super::*;
    pub fn init_global_state(ctx: Context<InitGlobalState>, nonce: u8) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        global_state.nonce = nonce;
        Ok(())
    }

    pub fn init_market(ctx: Context<InitMarket>, nonce: u8, title: String) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        let market = &mut ctx.accounts.market;
        market.index = global_state.num_markets;

        global_state.num_markets = global_state
            .num_markets
            .checked_add(1)
            .ok_or_else(|| ErrorCode::Overflow)?;
        
        market.whitelist = vec!(ctx.accounts.admin.key());
        market.nonce = nonce;
        market.title = title;
        Ok(())
    }

    #[access_control(
        Market::is_valid_admin(&ctx.accounts.market, ctx.accounts.admin.key)
    )]
    pub fn add_admin(ctx: Context<AddAdmin>) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        market.whitelist.push(ctx.accounts.add_admin.key());
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
        new_item.token_account = ctx.accounts.program_nft_account.to_account_info().key();
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

    // pub fn purchase_nft(
    //     ctx: Context<PurchaseNft>,
    // ) -> ProgramResult {
    //     let collection = &ctx.accounts.collection;
    //     let payment_mint = &ctx.accounts.payment_mint;

    //     let sale_price_option = collection.sale_prices.iter().find(|sp| sp.mint == payment_mint.key());
    //     let sale_price = match sale_price_option {
    //         Some(sale_price) => sale_price,
    //         None => return Err(ErrorCode::InvalidPurchaseMint.into())
    //     };

    //     let cpi_program = ctx.accounts.token_program.to_account_info();
    //     let cpi_accounts = Transfer {
    //         from: ctx.accounts.payment_account.to_account_info(),
    //         to: ctx.accounts.program_credit_account.to_account_info(),
    //         authority: ctx.accounts.user.to_account_info(),
    //     };
    //     let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    //     transfer(cpi_ctx, sale_price.amount)?;

    //     let prev_list_item = &mut ctx.accounts.prev_list_item;
    //     let next_list_item = &mut ctx.accounts.next_list_item;
    //     prev_list_item.next_list_item = next_list_item.to_account_info().key();
    //     next_list_item.prev_list_item = prev_list_item.to_account_info().key();

    //     let cpi_program = ctx.accounts.token_program.to_account_info();
    //     let cpi_accounts = Transfer {
    //         from: ctx.accounts.program_nft_account.to_account_info(),
    //         to: ctx.accounts.user_nft_account.to_account_info(),
    //         authority: ctx.accounts.global_state.to_account_info(),
    //     };
    //     let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    //     transfer(cpi_ctx, 1)?;

    //     Ok(())
    // }
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
        space = TokenAccountWrapper::LEN
    )]
    list_head: Account<'info, TokenAccountWrapper>,
    #[account(
        init,
        seeds = [
            collection.to_account_info().key.as_ref(),
            b"tail".as_ref(),
        ],
        bump = list_tail_nonce,
        payer = admin,
        space = TokenAccountWrapper::LEN
    )]
    list_tail: Account<'info, TokenAccountWrapper>,
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
    list_head: Box<Account<'info, TokenAccountWrapper>>,
    #[account(
        mut,
        address = list_head.next_list_item
    )]
    next_list_item: Box<Account<'info, TokenAccountWrapper>>,
    #[account(
        init,
        payer = admin,
        space = TokenAccountWrapper::LEN
    )]
    new_item: Box<Account<'info, TokenAccountWrapper>>,
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
        associated_token::authority = market,
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

// #[derive(Accounts)]
// pub struct PurchaseNft<'info> {
//     user: Signer<'info>,
//     #[account(
//         seeds = [
//             b"global".as_ref(),
//         ],
//         bump = global_state.nonce
//     )]
//     global_state: Account<'info, GlobalState>,
//     #[account(mut)]
//     purchase_list_item: Account<'info, TokenAccountWrapper>,
//     #[account(
//         mut,
//         address = purchase_list_item.next_list_item
//     )]
//     next_list_item: Account<'info, TokenAccountWrapper>,
//     #[account(
//         mut,
//         address = purchase_list_item.next_list_item
//     )]
//     prev_list_item: Account<'info, TokenAccountWrapper>,
//     #[account(address = purchase_list_item.collection)]
//     collection: Account<'info, Collection>,
//     #[account(address = purchase_list_item.token_account)]
//     program_nft_account: Account<'info, TokenAccount>,
//     #[account(address = program_nft_account.mint)]
//     program_nft_mint: Account<'info, TokenAccount>,
//     #[account(
//         init_if_needed,
//         payer = user,
// 	    associated_token::mint = program_nft_mint,
//         associated_token::authority = user,
//     )]
//     user_nft_account: Account<'info, TokenAccount>,
//     payment_account: Account<'info, TokenAccount>,
//     #[account(address = payment_account.mint)]
//     payment_mint: Account<'info, TokenAccount>,
//     #[account(
//         init_if_needed,
//         payer = user,
// 	    associated_token::mint = payment_mint,
//         associated_token::authority = global_state,
//     )]
//     program_credit_account: Account<'info, TokenAccount>,
//     #[account(address = associated_token::ID)]
//     associated_token_program: Program<'info, AssociatedToken>,
//     #[account(address = token::ID)]
//     token_program: Program<'info, Token>,
//     #[account(address = system_program::ID)]
//     system_program: Program<'info, System>,
//     rent: Sysvar<'info, Rent>,
// }

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
    pub const LEN: usize = 565;

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
                16
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
    pub const LEN: usize = 105;
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
pub struct TokenAccountWrapper {
    pub nonce: u8,
    pub token_account: Pubkey,
    pub price_model: Pubkey,
    pub prev_list_item: Pubkey,
    pub next_list_item: Pubkey,
    pub payer: Pubkey,
}

impl TokenAccountWrapper {
    pub const LEN: usize = 169;
}

#[account]
pub struct PriceModel {
    pub nonce: u8,
    pub index: u32,
    pub sale_prices: Vec<SalePrice>,
}

impl PriceModel {
    pub const LEN: usize = 340;
}

impl Default for PriceModel {
    fn default() -> Self {
        PriceModel {
            nonce: 0,
            index: 0,
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
}