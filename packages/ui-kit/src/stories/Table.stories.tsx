import type { Meta, StoryObj } from '@storybook/react';

import { Table, type TableProps } from '../components/Table';

interface Transaction {
  id: string;
  asset: string;
  amount: string;
  status: string;
}

const data: Transaction[] = [
  { id: '#48219', asset: 'USD → EUR', amount: '€48,200', status: 'Cleared' },
  { id: '#48220', asset: 'GBP → SGD', amount: 'S$112,000', status: 'Pending' },
  { id: '#48221', asset: 'JPY → USD', amount: '$68,410', status: 'Cleared' }
];

const DemoTable = (props: TableProps<Transaction>) => <Table<Transaction> {...props} />;

const meta: Meta<typeof DemoTable> = {
  title: 'Components/Table',
  component: DemoTable,
  args: {
    columns: [
      { key: 'id', header: 'Transaction ID' },
      { key: 'asset', header: 'Pair' },
      { key: 'amount', header: 'Amount' },
      {
        key: 'status',
        header: 'Status',
        render: (value) => (
          <span className={value === 'Cleared' ? 'text-accent' : 'text-muted'}>{value as string}</span>
        )
      }
    ],
    data
  }
};

export default meta;

type Story = StoryObj<typeof DemoTable>;

export const Default: Story = {};
