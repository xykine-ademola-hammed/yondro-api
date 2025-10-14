import VoteBookAccount from '../models/VoteBookAccount';
import VoucherLine from '../models/VoucherLine';
import { Op, Transaction } from 'sequelize';

class VoteBookService {
  static async calculateBalances(accountId: number) {
    const account = await VoteBookAccount.findByPk(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Calculate available balance using new formula
    const available = account.calculatedAvailable;

    return {
      allocation_base: account.allocation_base,
      sum_adjust_in: account.sum_adjust_in,
      sum_adjust_out: account.sum_adjust_out,
      sum_transfer_in: account.sum_transfer_in,
      sum_transfer_out: account.sum_transfer_out,
      carryover: account.carryover,
      committed: account.committed,
      spent: account.spent,
      available
    };
  }

  static async validateVoucherImpact(voucherLines: Array<{ account_id: number; total_amount: number }>) {
    const validationResults = [];

    for (const line of voucherLines) {
      const account = await VoteBookAccount.findByPk(line.account_id);
      if (!account) {
        validationResults.push({
          accountId: line.account_id,
          valid: false,
          error: 'Account not found'
        });
        continue;
      }

      if (account.is_frozen) {
        validationResults.push({
          accountId: line.account_id,
          valid: false,
          error: 'Account is frozen'
        });
        continue;
      }

      if (!account.is_active) {
        validationResults.push({
          accountId: line.account_id,
          valid: false,
          error: 'Account is inactive'
        });
        continue;
      }

      const balances = await this.calculateBalances(line.account_id);
      const availableAfterImpact = balances.available - line.total_amount;

      if (account.hard_ceiling && availableAfterImpact < 0) {
        validationResults.push({
          accountId: line.account_id,
          valid: false,
          error: 'Insufficient funds (hard ceiling)',
          currentBalance: balances.available,
          requiredAmount: line.total_amount,
          shortfall: Math.abs(availableAfterImpact)
        });
        continue;
      }

      if (account.soft_ceiling && availableAfterImpact < 0) {
        validationResults.push({
          accountId: line.account_id,
          valid: true,
          warning: 'Exceeds soft ceiling - approval required',
          currentBalance: balances.available,
          requiredAmount: line.total_amount,
          excess: Math.abs(availableAfterImpact)
        });
        continue;
      }

      validationResults.push({
        accountId: line.account_id,
        valid: true,
        currentBalance: balances.available,
        requiredAmount: line.total_amount,
        remainingBalance: availableAfterImpact
      });
    }

    return validationResults;
  }

  static async simulateVoucherImpact(voucherLines: Array<{ account_id: number; total_amount: number }>) {
    const simulations = [];

    for (const line of voucherLines) {
      const balances = await this.calculateBalances(line.account_id);
      const account = await VoteBookAccount.findByPk(line.account_id);

      simulations.push({
        accountId: line.account_id,
        accountCode: account?.code,
        accountName: account?.name,
        current: balances,
        impact: line.total_amount,
        afterImpact: {
          ...balances,
          committed: balances.committed + line.total_amount,
          available: balances.available - line.total_amount
        }
      });
    }

    return simulations;
  }

  static async commitFunds(voucherLines: Array<{ account_id: number; total_amount: number }>, transaction?: Transaction) {
    for (const line of voucherLines) {
      await VoteBookAccount.increment(
        { committed: line.total_amount },
        {
          where: { id: line.account_id },
          transaction
        }
      );
    }
  }

  static async releaseFunds(voucherLines: Array<{ account_id: number; total_amount: number }>, transaction?: Transaction) {
    for (const line of voucherLines) {
      await VoteBookAccount.decrement(
        { committed: line.total_amount },
        {
          where: { id: line.account_id },
          transaction
        }
      );
    }
  }

  static async postToVoteBook(voucherLines: Array<{ account_id: number; total_amount: number }>, transaction?: Transaction) {
    for (const line of voucherLines) {
      await VoteBookAccount.update(
        {
          committed: VoteBookAccount.sequelize!.literal(`committed - ${line.total_amount}`),
          spent: VoteBookAccount.sequelize!.literal(`spent + ${line.total_amount}`)
        },
        {
          where: { id: line.account_id },
          transaction
        }
      );
    }
  }
}

export default VoteBookService;