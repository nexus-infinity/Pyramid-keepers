
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  Baseline,
  ChevronDown,
  Film,
  Image,
  KeyRound,
  Layers,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Tv,
  X,
  MessageSquare,
  Mic,
  MapPin,
  Search,
  Volume2,
  Wand2,
  Brain,
  Video as VideoIcon,
  Send,
  Loader2
} from 'lucide-react';

const defaultProps = {
  strokeWidth: 1.5,
};

export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <KeyRound {...defaultProps} {...props} />
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <RefreshCw {...defaultProps} {...props} />;

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Sparkles {...defaultProps} {...props} />
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Plus {...defaultProps} {...props} />
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ChevronDown {...defaultProps} {...props} />;

export const SlidersHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <SlidersHorizontal {...defaultProps} {...props} />;

export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowRight {...defaultProps} {...props} />;

export const RectangleStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Layers {...defaultProps} {...props} />;

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <X {...defaultProps} {...props} />
);

export const TextModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Baseline {...defaultProps} {...props} />
);

export const FramesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Image {...defaultProps} {...props} />;

export const ReferencesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Film {...defaultProps} {...props} />;

export const TvIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Tv {...defaultProps} {...props} />
);

export const FilmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Film {...defaultProps} {...props} />
);

export const ChatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <MessageSquare {...defaultProps} {...props} />
);

export const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Mic {...defaultProps} {...props} />
);

export const MapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <MapPin {...defaultProps} {...props} />
);

export const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Search {...defaultProps} {...props} />
);

export const VolumeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Volume2 {...defaultProps} {...props} />
);

export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Wand2 {...defaultProps} {...props} />
);

export const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Brain {...defaultProps} {...props} />
);

export const VideoCameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <VideoIcon {...defaultProps} {...props} />
);

export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Send {...defaultProps} {...props} />
);

export const LoadingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Loader2 {...defaultProps} className={`animate-spin ${props.className}`} />
);

export const CurvedArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowDown {...props} strokeWidth={3} />;
