/**
 * ProfilePage
 * User profile page matching ExecutionHistoryPage structure
 */

import React from 'react';
import { ProfileList } from '@/features/profile/components';

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <ProfileList />
    </div>
  );
};

export default ProfilePage;
