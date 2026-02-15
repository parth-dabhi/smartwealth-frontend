import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export const GoalsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Button>Add New</Button>
      </div>
      <Card title="Goals Management">
        <p className="text-gray-600">
          Goals management features will be displayed here.
          Full implementation with forms, tables, and API integration.
        </p>
      </Card>
    </div>
  );
};
