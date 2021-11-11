use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    system_program,
};
use anchor_spl::token::{
    self, transfer, TokenAccount, Transfer, Token
};
use anchor_spl::associated_token::{
    self, AssociatedToken,
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vibe_market {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, nonce: u8) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        global_state.whitelist = vec!(ctx.accounts.admin.key());
        global_state.nonce = nonce;
        Ok(())
    }

    #[access_control(
        GlobalState::is_valid_admin(&ctx.accounts.global_state, ctx.accounts.admin.key)
    )]
    pub fn add_admin(ctx: Context<AddAdmin>) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        global_state.whitelist.push(ctx.accounts.new_admin.key());
        Ok(())
    }

    #[access_control(
        GlobalState::is_valid_admin(&ctx.accounts.global_state, ctx.accounts.admin.key)
    )]
    pub fn remove_admin(ctx: Context<RemoveAdmin>) -> ProgramResult {
        if ctx.accounts.admin.key() == ctx.accounts.remove_admin.key() {
            return Err(ErrorCode::CannotRemoveSelf.into());
        };

        let remove_admin_key = &ctx.accounts.remove_admin.key();
        let global_state = &mut ctx.accounts.global_state;
        global_state.whitelist = global_state.whitelist.clone().into_iter()
            .filter(|p| p != remove_admin_key).collect();

        Ok(())
    }

    #[access_control(
        GlobalState::is_valid_admin(&ctx.accounts.global_state, ctx.accounts.admin.key)
    )]
    pub fn init_collection(
        ctx: Context<InitCollection>,
        collection_nonce: u8,
        list_head_nonce: u8,
        list_tail_nonce: u8,
        title: String,
        sale_prices: Vec<SalePrice>,
    ) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        global_state.num_collections += 1;

        let collection = &mut ctx.accounts.collection;
        collection.title = title;
        collection.sale_prices = sale_prices;
        collection.nonce = collection_nonce;
        collection.list_head = ctx.accounts.list_head.to_account_info().key();
        collection.list_tail = ctx.accounts.list_tail.to_account_info().key();

        let list_head = &mut ctx.accounts.list_head;
        list_head.next_list_item = ctx.accounts.list_tail.to_account_info().key();
        list_head.collection = collection.to_account_info().key();
        list_head.nonce = list_head_nonce;

        let list_tail = &mut ctx.accounts.list_tail;
        list_tail.prev_list_item = ctx.accounts.list_head.to_account_info().key();
        list_tail.collection = collection.to_account_info().key();
        list_tail.nonce = list_tail_nonce;

        Ok(())
    }

    #[access_control(
        GlobalState::is_valid_admin(&ctx.accounts.global_state, ctx.accounts.admin.key)
    )]
    pub fn add_nft(
        ctx: Context<AddNft>,
    ) -> ProgramResult {
        let list_head = &mut ctx.accounts.list_head;
        list_head.next_list_item = ctx.accounts.new_item.to_account_info().key();

        let next_list_item = &mut ctx.accounts.next_list_item;
        next_list_item.prev_list_item = ctx.accounts.new_item.to_account_info().key();

        // let new_item = &mut ctx.accounts.new_item;
        // new_item.collection = ctx.accounts.collection.to_account_info().key();
        // new_item.next_list_item = ctx.accounts.next_list_item.to_account_info().key();
        // new_item.prev_list_item = ctx.accounts.list_head.to_account_info().key();
        // new_item.token_account = ctx.accounts.program_nft_account.to_account_info().key();
        
        // let cpi_program = ctx.accounts.token_program.to_account_info();
        // let cpi_accounts = Transfer {
        //     from: ctx.accounts.admin_nft_account.to_account_info(),
        //     to: ctx.accounts.program_nft_account.to_account_info(),
        //     authority: ctx.accounts.admin.to_account_info(),
        // };
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // transfer(cpi_ctx, 1)?;

        Ok(())
    }

    pub fn purchase_nft(
        ctx: Context<PurchaseNft>,
    ) -> ProgramResult {
        let collection = &ctx.accounts.collection;
        let payment_mint = &ctx.accounts.payment_mint;

        let sale_price_option = collection.sale_prices.iter().find(|sp| sp.mint == payment_mint.key());
        let sale_price = match sale_price_option {
            Some(sale_price) => sale_price,
            None => return Err(ErrorCode::InvalidPurchaseMint.into())
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.payment_account.to_account_info(),
            to: ctx.accounts.program_credit_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, sale_price.amount)?;

        let prev_list_item = &mut ctx.accounts.prev_list_item;
        let next_list_item = &mut ctx.accounts.next_list_item;
        prev_list_item.next_list_item = next_list_item.to_account_info().key();
        next_list_item.prev_list_item = prev_list_item.to_account_info().key();

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.program_nft_account.to_account_info(),
            to: ctx.accounts.user_nft_account.to_account_info(),
            authority: ctx.accounts.global_state.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, 1)?;

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
pub struct Initialize<'info> {
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
    system_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct AddAdmin<'info> {
    admin: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"global".as_ref(),
        ],
        bump = global_state.nonce
    )]
    global_state: Account<'info, GlobalState>,
    new_admin: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RemoveAdmin<'info> {
    admin: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"global".as_ref(),
        ],
        bump = global_state.nonce
    )]
    global_state: Account<'info, GlobalState>,
    remove_admin: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(
    collection_nonce: u8,
    list_head_nonce: u8,
    list_tail_nonce: u8,
    title: String,
    sale_prices: Vec<SalePrice>,
)]
pub struct InitCollection<'info> {
    admin: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"global".as_ref(),
        ],
        bump = global_state.nonce
    )]
    global_state: Account<'info, GlobalState>,
    #[account(
        init,
        seeds = [
            global_state.to_account_info().key.as_ref(),
            &global_state.num_collections.to_le_bytes(),
        ],
        bump = collection_nonce,
        payer = admin
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
    )]
    list_tail: Account<'info, TokenAccountWrapper>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddNft<'info> {
    admin: Signer<'info>,
    #[account(
        seeds = [
            b"global".as_ref(),
        ],
        bump = global_state.nonce
    )]
    global_state: Account<'info, GlobalState>,
    #[account(address = list_head.collection)]
    collection: Account<'info, Collection>,
    #[account(mut)]
    list_head: Account<'info, TokenAccountWrapper>,
    #[account(
        mut,
        address = list_head.next_list_item
    )]
    next_list_item: Account<'info, TokenAccountWrapper>,
    #[account(
        init,
        payer = admin,
    )]
    new_item: Account<'info, TokenAccountWrapper>,
    admin_nft_account: Account<'info, TokenAccount>,
    #[account(address = admin_nft_account.mint)]
    admin_nft_mint: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = admin,
	    associated_token::mint = admin_nft_mint,
        associated_token::authority = global_state,
    )]
    program_nft_account: Account<'info, TokenAccount>,
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
    user: Signer<'info>,
    #[account(
        seeds = [
            b"global".as_ref(),
        ],
        bump = global_state.nonce
    )]
    global_state: Account<'info, GlobalState>,
    #[account(mut)]
    purchase_list_item: Account<'info, TokenAccountWrapper>,
    #[account(
        mut,
        address = purchase_list_item.next_list_item
    )]
    next_list_item: Account<'info, TokenAccountWrapper>,
    #[account(
        mut,
        address = purchase_list_item.next_list_item
    )]
    prev_list_item: Account<'info, TokenAccountWrapper>,
    #[account(address = purchase_list_item.collection)]
    collection: Account<'info, Collection>,
    #[account(address = purchase_list_item.token_account)]
    program_nft_account: Account<'info, TokenAccount>,
    #[account(address = program_nft_account.mint)]
    program_nft_mint: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
	    associated_token::mint = program_nft_mint,
        associated_token::authority = user,
    )]
    user_nft_account: Account<'info, TokenAccount>,
    payment_account: Account<'info, TokenAccount>,
    #[account(address = payment_account.mint)]
    payment_mint: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
	    associated_token::mint = payment_mint,
        associated_token::authority = global_state,
    )]
    program_credit_account: Account<'info, TokenAccount>,
    #[account(address = associated_token::ID)]
    associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = token::ID)]
    token_program: Program<'info, Token>,
    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

/*******************/
/* DATA STRUCTURES */
/*******************/

#[account]
pub struct GlobalState {
    pub nonce: u8,
    pub whitelist: Vec<Pubkey>,
    pub num_collections: u32,
}

impl GlobalState {
    fn is_valid_admin(global_state: &GlobalState, admin: &Pubkey) -> Result<()> {
        if !global_state.whitelist.contains(&admin) {
            return Err(ErrorCode::Unauthorized.into());
        };
        return Ok(())
    }
}

impl Default for GlobalState {
    fn default() -> Self {
        GlobalState {
            nonce: 0,
            whitelist: vec![
                Pubkey::default();
                8
            ],
            num_collections: 0,
        }
    }
}

#[account]
pub struct Collection {
    pub nonce: u8,
    pub title: String,
    pub sale_prices: Vec<SalePrice>,
    pub list_head: Pubkey,
    pub list_tail: Pubkey,
}

impl Default for Collection {
    fn default() -> Self {
        Collection {
            nonce: 0,
            title: String::with_capacity(64),
            sale_prices: vec![
                SalePrice {
                    mint: Pubkey::default(),
                    amount: 0,
                };
                8
            ],
            list_head: Pubkey::default(),
            list_tail: Pubkey::default(),
        }
    }
}

#[account]
#[derive(Default)]
pub struct TokenAccountWrapper {
    pub nonce: u8,
    pub token_account: Pubkey,
    pub collection: Pubkey,
    pub prev_list_item: Pubkey,
    pub next_list_item: Pubkey,
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
}