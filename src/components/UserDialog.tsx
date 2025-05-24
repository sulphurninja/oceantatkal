'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const userSchema = z.object({
  subs_credentials: z.object({
    user_name: z.string().min(3),
    password: z.string().min(6)
  }),
  other_preferences: z.object({
    plan: z.enum(['free', 'basic', 'premium']),
    plan_expiry: z.date()
  }),
  devices: z.string().optional()
});

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user?: any;
}

export default function UserDialog({ open, onOpenChange, onSuccess, user }: UserDialogProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      subs_credentials: {
        user_name: user?.subs_credentials?.user_name || '',
        password: ''
      },
      other_preferences: {
        plan: user?.other_preferences?.plan || 'free',
        plan_expiry: user?.other_preferences?.plan_expiry || new Date()
      },
      devices: user?.devices?.join(', ') || ''
    }
  });

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    try {
      const url = user ? `/api/admin/users/${user._id}` : '/api/admin/users';
      const method = user ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          devices: data.devices?.split(',').map(d => d.trim()) || [],
          other_preferences: {
            ...data.other_preferences,
            plan_expiry: data.other_preferences.plan_expiry.toISOString()
          }
        })
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('User operation failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input {...register('subs_credentials.user_name')} />
            {errors.subs_credentials?.user_name && (
              <span className="text-red-500 text-sm">
                {errors.subs_credentials.user_name.message}
              </span>
            )}
          </div>

          {!user && (
            <div>
              <Label>Password</Label>
              <Input type="password" {...register('subs_credentials.password')} />
              {errors.subs_credentials?.password && (
                <span className="text-red-500 text-sm">
                  {errors.subs_credentials.password.message}
                </span>
              )}
            </div>
          )}

          <div>
            <Label>Subscription Plan</Label>
            <select
              {...register('other_preferences.plan')}
              className="border rounded-md w-full p-2"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <Label>Expiry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(watch('other_preferences.plan_expiry'), 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watch('other_preferences.plan_expiry')}
                  onSelect={(date) => setValue('other_preferences.plan_expiry', date || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Devices (comma separated)</Label>
            <Input {...register('devices')} />
          </div>

          <DialogFooter>
            <Button type="submit">{user ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
