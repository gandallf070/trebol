import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResponsiveNav from '../components/ResponsiveNav';

const RootLayout = () => {
  const { user } = useAuth();

  return (
    <ResponsiveNav />
  );
};

export default RootLayout;
