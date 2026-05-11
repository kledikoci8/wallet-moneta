import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createChatStyles } from '../../assets/styles/chat.styles';
import { useTheme } from '../../hooks/useTheme';
import { API_URL } from '../../constants/api';

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createChatStyles(COLORS), [COLORS]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [financialContext, setFinancialContext] = useState(null);
  const scrollViewRef = useRef(null);
  
  // Typing animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (isTyping) {
      animateTyping();
    }
  }, [isTyping]);

  const animateTyping = () => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/suggestions/${user.id}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions(["How can I save more?", "Analyze my spending", "Budgeting tips"]);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: text.trim()
        })
      });

      const data = await response.json();
      
      setIsTyping(false);
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.message || "Sorry, I couldn't process that. Please try again.",
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (data.context) {
        setFinancialContext(data.context);
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please check your internet and try again.",
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    sendMessage(suggestion);
  };

  const renderMessage = (message) => (
    <View 
      key={message.id} 
      style={[styles.messageRow, message.isUser ? styles.messageRowUser : styles.messageRowBot]}
    >
      {!message.isUser && (
        <View style={styles.botAvatarSmall}>
          <Ionicons name="sparkles" size={16} color={COLORS.white} />
        </View>
      )}
      <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, message.isUser ? styles.userText : styles.botText]}>
          {message.text}
        </Text>
        <Text style={[styles.messageTime, message.isUser ? styles.userTime : styles.botTime]}>
          {message.time}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.botAvatarSmall}>
        <Ionicons name="sparkles" size={16} color={COLORS.white} />
      </View>
      <View style={styles.typingDots}>
        {[dot1, dot2, dot3].map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.typingDot,
              {
                transform: [{
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6]
                  })
                }]
              }
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeAvatar}>
        <Ionicons name="sparkles" size={40} color={COLORS.white} />
      </View>
      <Text style={styles.welcomeTitle}>Hi, I'm FinBot! 👋</Text>
      <Text style={styles.welcomeText}>
        I'm your personal financial assistant. Ask me anything about your finances, budgeting tips, or how to reach your savings goals!
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={22} color={COLORS.white} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>FinBot</Text>
            <Text style={styles.headerSubtitle}>● Online</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && renderWelcome()}
        {messages.map(renderMessage)}
        {isTyping && renderTypingIndicator()}
      </ScrollView>

      {/* Suggestions */}
      {messages.length === 0 && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick questions</Text>
          <View style={styles.suggestionsRow}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask me anything..."
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isTyping}
        >
          <Ionicons name="send" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
