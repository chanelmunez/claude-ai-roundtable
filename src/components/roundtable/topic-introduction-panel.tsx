'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Lightbulb, 
  Play, 
  Users, 
  Settings, 
  Sparkles,
  Brain,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import type { ConversationMode, AIModel } from '@/lib/types';

interface TopicIntroductionPanelProps {
  onStartConversation: (topic: string, mode: ConversationMode, selectedAIs: string[]) => void;
  availableAIs: AIModel[];
  isLoading?: boolean;
  className?: string;
}

const CONVERSATION_MODES: Array<{
  mode: ConversationMode;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}> = [
  {
    mode: 'witty',
    icon: Sparkles,
    title: 'Witty',
    description: 'Clever observations and engaging humor',
    color: '#10B981'
  },
  {
    mode: 'comedic',
    icon: MessageSquare,
    title: 'Comedic',
    description: 'Light-hearted jokes and amusing takes',
    color: '#F59E0B'
  },
  {
    mode: 'serious',
    icon: Brain,
    title: 'Serious',
    description: 'Professional and thoughtful discussion',
    color: '#6B7280'
  },
  {
    mode: 'academic',
    icon: BookOpen,
    title: 'Academic',
    description: 'Scholarly analysis and research-based insights',
    color: '#8B5CF6'
  }
];

const TOPIC_TEMPLATES = [
  "The future of artificial intelligence and its impact on society",
  "Climate change solutions and environmental sustainability",
  "The role of technology in modern education",
  "Space exploration and the search for extraterrestrial life",
  "The ethics of genetic engineering and biotechnology",
  "The future of work in an automated world",
  "Digital privacy and surveillance in the modern age",
  "The impact of social media on mental health",
  "Renewable energy and the transition away from fossil fuels",
  "The philosophy of consciousness and what it means to be human"
];

export function TopicIntroductionPanel({
  onStartConversation,
  availableAIs,
  isLoading = false,
  className = ''
}: TopicIntroductionPanelProps) {
  const [topic, setTopic] = useState('');
  const [selectedMode, setSelectedMode] = useState<ConversationMode>('witty');
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);

  const handleStartConversation = () => {
    if (!topic.trim()) return;
    
    onStartConversation(
      topic.trim(), 
      selectedMode, 
      selectedAIs.length > 0 ? selectedAIs : availableAIs.slice(0, 6).map(ai => ai.id)
    );
  };

  const handleTopicTemplate = (template: string) => {
    setTopic(template);
  };

  const toggleAISelection = (aiId: string) => {
    setSelectedAIs(prev => 
      prev.includes(aiId) 
        ? prev.filter(id => id !== aiId)
        : [...prev, aiId]
    );
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-6 h-6 text-accent" />
          <span>Start a New Roundtable Discussion</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a topic and conversation style to begin an AI roundtable discussion
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Discussion Topic</label>
          <Textarea
            placeholder="Enter your discussion topic here..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          {/* Topic Templates */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick templates:</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {TOPIC_TEMPLATES.map((template, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/10 text-xs px-2 py-1"
                  onClick={() => handleTopicTemplate(template)}
                >
                  {template.length > 50 ? `${template.slice(0, 50)}...` : template}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Conversation Mode</label>
          <div className="grid grid-cols-2 gap-3">
            {CONVERSATION_MODES.map(({ mode, icon: Icon, title, description, color }) => (
              <motion.div
                key={mode}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode(mode)}
                className={`
                  cursor-pointer rounded-lg border-2 p-3 transition-all
                  ${selectedMode === mode 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50'
                  }
                `}
              >
                <div className="flex items-start space-x-2">
                  <div 
                    className="w-5 h-5 mt-0.5"
                    style={{ color: selectedMode === mode ? '#f5a442' : color }}
                  >
                    <Icon className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Participants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">AI Participants</label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Customize ({selectedAIs.length > 0 ? selectedAIs.length : 'All'})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Select AI Participants</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {availableAIs.map(ai => (
                    <motion.div
                      key={ai.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => toggleAISelection(ai.id)}
                      className={`
                        cursor-pointer rounded-lg border-2 p-3 transition-all
                        ${selectedAIs.includes(ai.id) || selectedAIs.length === 0
                          ? 'border-accent bg-accent/10' 
                          : 'border-border hover:border-accent/50'
                        }
                      `}
                      style={{
                        borderColor: (selectedAIs.includes(ai.id) || selectedAIs.length === 0) ? ai.color : undefined
                      }}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-lg">{ai.provider === 'openai' ? '🧠' : ai.provider === 'anthropic' ? '🎭' : '🤖'}</div>
                        <div className="font-medium text-xs">{ai.persona}</div>
                        <Badge variant="outline" className="text-xs">
                          {ai.provider.toUpperCase()}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {selectedAIs.length > 0 
              ? `${selectedAIs.length} AI participants selected`
              : `All ${availableAIs.length} AI participants will join the discussion`
            }
          </div>
        </div>

        {/* Start Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleStartConversation}
            disabled={!topic.trim() || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <Users className="w-4 h-4" />
              </motion.div>
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Starting Discussion...' : 'Start Roundtable Discussion'}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}