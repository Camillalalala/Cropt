import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { llmService } from '../services/LLMService';

type Props = {
  visible: boolean;
  diseaseLabel: string;
  diseaseId: string;
  confidence: number;
  onClose: () => void;
};

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

export function LLMChatModal({ visible, diseaseLabel, diseaseId, confidence, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const cancelRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && !llmService.isReady()) {
      initModel();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      // Clean up on close
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
      setStreamingText('');
      setIsLoading(false);
    }
  }, [visible]);

  const initModel = async () => {
    setIsModelLoading(true);
    setModelProgress(0);
    try {
      await llmService.initialize((progress) => setModelProgress(progress));
      setModelProgress(null);
    } catch (error) {
      Alert.alert('Model Error', 'Could not load the AI model. Try again later.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!llmService.isReady()) {
      Alert.alert('Model Loading', 'The AI model is still loading. Please wait.');
      return;
    }

    const userMessage: Message = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    const cancel = llmService.generate(
      trimmed,
      { disease: diseaseLabel, confidence },
      (token) => {
        setStreamingText((prev) => prev + token);
      },
      (fullResponse) => {
        setMessages((prev) => [...prev, { role: 'assistant', text: fullResponse }]);
        setStreamingText('');
        setIsLoading(false);
        cancelRef.current = null;
      },
      (error) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' },
        ]);
        setStreamingText('');
        setIsLoading(false);
        cancelRef.current = null;
      }
    );

    cancelRef.current = cancel;
  };

  const handleStop = () => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    if (streamingText) {
      setMessages((prev) => [...prev, { role: 'assistant', text: streamingText + ' [stopped]' }]);
      setStreamingText('');
    }
    setIsLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={24} color="#166534" />
            <View>
              <Text style={styles.headerTitle}>Ask About {diseaseLabel}</Text>
              <Text style={styles.headerSubtitle}>Offline AI Agricultural Expert</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Model loading indicator */}
        {isModelLoading && (
          <View style={styles.loadingBanner}>
            <Ionicons name="cloud-download" size={20} color="#166534" />
            <Text style={styles.loadingText}>
              {modelProgress != null
                ? `Downloading AI model... ${(modelProgress * 100).toFixed(0)}%`
                : 'Loading AI model...'}
            </Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Welcome message */}
          {messages.length === 0 && !streamingText && (
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Ask a Question</Text>
              <Text style={styles.welcomeBody}>
                Ask any question about {diseaseLabel} — treatment, prevention, or crop care.
                Answers are generated on-device, no internet needed.
              </Text>
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Suggested questions:</Text>
                {[
                  `What causes ${diseaseLabel}?`,
                  `How do I prevent ${diseaseLabel} next season?`,
                  'What organic treatments can I use?',
                ].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setInput(q);
                    }}
                  >
                    <Text style={styles.suggestionText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.assistantText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}

          {/* Streaming text */}
          {streamingText ? (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <Text style={[styles.messageText, styles.assistantText]}>
                {streamingText}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type your question..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            editable={!isModelLoading}
          />
          {isLoading ? (
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Ionicons name="stop" size={24} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isModelLoading) && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isModelLoading}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  closeButton: {
    padding: 8,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#dcfce7',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 12,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  welcomeBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  suggestionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  suggestionChip: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestionText: {
    fontSize: 14,
    color: '#166534',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#166534',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#111827',
  },
  cursor: {
    color: '#166534',
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
