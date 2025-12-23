import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 模拟故事内容
const MOCK_STORY = {
  id: 1,
  title: "The CEO's Secret Love",
  authorName: 'Romance Writer',
  content: `Chapter 1: The Unexpected Meeting

Sarah had never imagined that her first day as a temp at Hartwell Industries would change her life forever. The towering glass building in downtown Manhattan was intimidating enough, but nothing could have prepared her for what awaited inside.

The elevator doors slid open on the 50th floor, revealing a sleek, modern office space that screamed wealth and power. She clutched her coffee nervously, trying to remember the directions the receptionist had given her.

"You must be the new temp," a deep voice said from behind her.

She spun around, nearly spilling her coffee, and found herself face to face with the most handsome man she had ever seen. Dark hair, steel-gray eyes, and a jawline that could cut glass. He wore a perfectly tailored suit that probably cost more than her entire wardrobe.

"I... yes, I'm Sarah Mitchell," she managed to stammer out.

A hint of a smile played at the corner of his lips. "I'm Alexander Hartwell. Welcome to my company."

The CEO. Of course it had to be the CEO.

Her heart pounded as she realized she was standing in front of a man worth billions, and all she could think about was how his eyes seemed to see right through her.

"Thank you, Mr. Hartwell," she said, trying to regain her composure. "I'm looking forward to working here."

He studied her for a moment longer than necessary. "Something tells me things are about to get very interesting around here."

As he walked away, Sarah couldn't shake the feeling that her life had just taken a dramatic turn. Little did she know, this was only the beginning of a love story that would defy all expectations.

Chapter 2: The Late Night

Three weeks into her temporary position, Sarah had learned several things about Alexander Hartwell:

1. He was a workaholic who often stayed past midnight.
2. He had a reputation for being cold and distant with everyone.
3. And for some inexplicable reason, he wasn't cold or distant with her.

It started with small things – a nod of acknowledgment when they passed in the hallway, a brief conversation about the weather, and once, an actual compliment on her work organizing the quarterly reports.

But tonight was different.

The storm outside had knocked out the subway, and Sarah found herself trapped in the office at 10 PM, waiting for the rain to subside. She was alone on the floor – or so she thought.

"Working late?" Alexander appeared in the doorway of her small office, his tie loosened, his sleeves rolled up. He looked almost... human.

"The storm," she explained, gesturing toward the window where rain lashed against the glass. "I can't get home."

He was quiet for a moment, then said something that surprised her. "Have you eaten? I was about to order dinner. You're welcome to join me."

It wasn't a command. It was an invitation. And against every instinct telling her to maintain professional boundaries, she said yes.

That night, over Chinese takeout in the CEO's private dining room, Sarah discovered that Alexander Hartwell was not at all what he seemed...`,
  wordCount: 18000,
  likeCount: 12500,
  averageRating: 4.5,
};

export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showControls, setShowControls] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [bgColor, setBgColor] = useState<'white' | 'cream' | 'dark'>('cream');

  // 模拟数据
  const story = MOCK_STORY;

  // 自动隐藏控制栏
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  const bgStyles = {
    white: 'bg-white',
    cream: 'bg-amber-50',
    dark: 'bg-gray-900',
  };

  const textStyles = {
    white: 'text-gray-900',
    cream: 'text-gray-900',
    dark: 'text-gray-100',
  };

  return (
    <View className={`flex-1 ${bgStyles[bgColor]}`}>
      {/* 顶部控制栏 */}
      {showControls && (
        <SafeAreaView className="absolute top-0 left-0 right-0 z-10 bg-black/60">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable onPress={() => router.back()} className="p-2">
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </Pressable>
            <Text className="text-white font-semibold text-lg flex-1 text-center" numberOfLines={1}>
              {story.title}
            </Text>
            <Pressable className="p-2">
              <Ionicons name="settings" size={24} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>
      )}

      {/* 阅读内容 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 120, paddingHorizontal: 20 }}
        onTouchEnd={() => setShowControls(!showControls)}
      >
        {/* 标题 */}
        <Text className={`text-2xl font-bold mb-2 ${textStyles[bgColor]}`}>
          {story.title}
        </Text>
        <Text className={`mb-6 ${bgColor === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          by {story.authorName}
        </Text>

        {/* 正文 */}
        <Text
          className={textStyles[bgColor]}
          style={{
            fontSize: fontSize,
            lineHeight: fontSize * 1.8,
          }}
        >
          {story.content}
        </Text>

        {/* 结尾 */}
        <View className="mt-10 pt-6 border-t border-gray-200 items-center">
          <Text className={`text-lg font-medium mb-4 ${textStyles[bgColor]}`}>
            End of Story
          </Text>
          <View className="flex-row items-center space-x-6">
            <Pressable className="items-center">
              <Ionicons name="heart" size={28} color="#ef4444" />
              <Text className="text-gray-500 mt-1">{story.likeCount}</Text>
            </Pressable>
            <Pressable className="items-center">
              <Ionicons name="star" size={28} color="#eab308" />
              <Text className="text-gray-500 mt-1">{story.averageRating}</Text>
            </Pressable>
            <Pressable className="items-center">
              <Ionicons name="chatbubble-outline" size={28} color="#6b7280" />
              <Text className="text-gray-500 mt-1">Comment</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* 底部控制栏 */}
      {showControls && (
        <SafeAreaView className="absolute bottom-0 left-0 right-0 bg-black/60">
          <View className="px-4 py-4">
            {/* 字体大小 */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white">Font Size</Text>
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => setFontSize(Math.max(14, fontSize - 2))}
                  className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                >
                  <Text className="text-white text-xl">A-</Text>
                </Pressable>
                <Text className="text-white mx-4">{fontSize}</Text>
                <Pressable
                  onPress={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                >
                  <Text className="text-white text-xl">A+</Text>
                </Pressable>
              </View>
            </View>

            {/* 背景色 */}
            <View className="flex-row items-center justify-between">
              <Text className="text-white">Background</Text>
              <View className="flex-row items-center space-x-3">
                <Pressable
                  onPress={() => setBgColor('white')}
                  className={`w-10 h-10 bg-white rounded-full ${
                    bgColor === 'white' ? 'border-2 border-butter-500' : ''
                  }`}
                />
                <Pressable
                  onPress={() => setBgColor('cream')}
                  className={`w-10 h-10 bg-amber-100 rounded-full ${
                    bgColor === 'cream' ? 'border-2 border-butter-500' : ''
                  }`}
                />
                <Pressable
                  onPress={() => setBgColor('dark')}
                  className={`w-10 h-10 bg-gray-800 rounded-full ${
                    bgColor === 'dark' ? 'border-2 border-butter-500' : ''
                  }`}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
