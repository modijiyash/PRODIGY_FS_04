import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axios from 'axios';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const { socket, authUser } = useContext(AuthContext);

  const getUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/messages/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setUsers(data.user);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

const sendMessage = async (messageData) => {
  try {
    const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
    console.log("sendMessage response:", data);

    if (data && data.newMessage) {
      return data.newMessage;
    } else {
      throw new Error(data.message || 'Failed to send');
    }
  } catch (error) {
    console.error("sendMessage error:", error);
    toast.error('Failed to send');
    throw error;
  }
};



  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });
  };

  const unsubscribeFromMessage = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessage();
  }, [socket, selectedUser]);

  const value = {
    messages,
    setMessages,     
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
