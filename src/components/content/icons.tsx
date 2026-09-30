import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, Calendar, Check, ChevronDown,
  ChevronRight, Clock, CreditCard, Crown, Download, ExternalLink, Flame, Gift, Globe, Heart,
  HelpCircle, Info, Lock, Mail, MapPin, Minus, Pause, Percent, Phone, Play, Plus, Search,
  Settings, Share2, Shield, ShoppingCart, Smile, Sparkles, Star, Tag, ThumbsUp, Trophy, Unlock,
  User, Users, X, Zap, type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/schema/components";

export const ICONS: Record<IconName, LucideIcon> = {
  check: Check, x: X, plus: Plus, minus: Minus, star: Star, heart: Heart, gift: Gift, bell: Bell,
  mail: Mail, phone: Phone, user: User, users: Users, lock: Lock, unlock: Unlock, shield: Shield,
  zap: Zap, flame: Flame, trophy: Trophy, crown: Crown, clock: Clock, calendar: Calendar,
  "map-pin": MapPin, search: Search, settings: Settings, info: Info,
  "alert-triangle": AlertTriangle, "help-circle": HelpCircle, "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft, "arrow-up": ArrowUp, "arrow-down": ArrowDown,
  "chevron-right": ChevronRight, "chevron-down": ChevronDown, "external-link": ExternalLink,
  download: Download, share: Share2, play: Play, pause: Pause, sparkles: Sparkles, tag: Tag,
  percent: Percent, "credit-card": CreditCard, "shopping-cart": ShoppingCart, "thumbs-up": ThumbsUp,
  smile: Smile, globe: Globe,
};
