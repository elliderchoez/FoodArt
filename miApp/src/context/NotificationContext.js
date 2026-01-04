import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationCount = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationCount debe usarse dentro de NotificationProvider');
  }
  return context;
};
