import { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandableCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  onContributeClick?: () => void;
}

const ExpandableCard = ({ title, icon, children, isExpanded, onToggle, index, onContributeClick }: ExpandableCardProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (contentRef.current) {
      if (isExpanded) {
        setHeight(contentRef.current.scrollHeight);
      } else {
        setHeight(0);
      }
    }
  }, [isExpanded]);

  return (
    <div
      className="relative overflow-hidden cursor-pointer rounded-2xl"
      onClick={onToggle}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.9) 100%)',
        boxShadow: '0 10px 25px rgba(30, 58, 138, 0.2), 0 0 15px rgba(59, 130, 246, 0.1)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
      }}
    >
      {/* Card Content */}
      <div className="relative z-10">
        {/* Card Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-white">
              {icon}
            </div>
            <h3 className="text-white font-display text-lg font-semibold">{title}</h3>
          </div>
          <div
            className="text-white/80"
          >
            <ChevronDown 
              className={`w-5 h-5 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isExpanded ? 'rotate-180' : ''}`}
            />

          </div>
        </div>

        {/* Card Content - Expandable with smooth unfolding transition */}
        <div
          ref={contentRef}
          className="overflow-hidden"
          style={{ 
            height: height,
            transition: 'height 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div className="px-6 pb-6 border-t border-white/20 pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Card 1: Chuo Kikuu Friends
export const ChuoKikuuFriendsCard = ({ isExpanded, onToggle, index }: { isExpanded: boolean; onToggle: () => void; index: number }) => {
  const whatsAppLink = "https://chat.whatsapp.com/example"; // Replace with actual WhatsApp group link

  return (
    <ExpandableCard
      title="Chuo Kikuu Friends"
      isExpanded={isExpanded}
      onToggle={onToggle}
      index={index}
    >
      <div className="space-y-4">
        <p className="text-white/90 leading-relaxed">
          Click to join the WhatsApp group for Chuo Kikuu Friends and stay connected with our community.
        </p>
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105"
          onClick={(e) => e.stopPropagation()}
        >
          Join WhatsApp Group
        </a>
      </div>
    </ExpandableCard>
  );
};

// Card 2: Impact
export const ImpactCard = ({ 
  isExpanded, 
  onToggle, 
  index,
  totalContributed = 0, 
  activeMembers = 0 
}: { 
  isExpanded: boolean; 
  onToggle: () => void; 
  index: number;
  totalContributed?: number; 
  activeMembers?: number 
}) => {
  const impactPoints = [
    "Supporting weekly worship services and spiritual programs",
    "Funding educational initiatives and Bible study materials",
    "Helping community outreach and welfare programs",
    "Maintaining church facilities and grounds",
    "Supporting missionary work and evangelism efforts",
  ];

  return (
    <ExpandableCard
      title="Impact"
      isExpanded={isExpanded}
      onToggle={onToggle}
      index={index}
    >
      <div className="space-y-4">
        <p className="text-white/90 leading-relaxed">
          Your contributions have made a significant difference in advancing the mission of Chuo Kikuu SDA Church. Here's how your generosity is helping:
        </p>
        <ul className="space-y-2">
          {impactPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-white/85">
              <span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </ExpandableCard>
  );
};

// 
export const CallToActionCard = ({ 
  isExpanded, 
  onToggle, 
  index,
  onContributeClick 
}: { 
  isExpanded: boolean; 
  onToggle: () => void; 
  index: number;
  onContributeClick?: () => void 
}) => {
  return (
    <ExpandableCard
      title="Call to Action"
      isExpanded={isExpanded}
      onToggle={onToggle}
      index={index}
    >
      <div className="space-y-4">
        <p className="text-white/90 leading-relaxed">
          Join us in building God's kingdom through your generous support. Every contribution, no matter the size, makes a meaningful impact in our church community and beyond.
        </p>
        <p className="text-white/90 leading-relaxed">
          Your faithfulness in giving helps us continue our mission of sharing God's love and making a difference in the lives of others.
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onContributeClick) onContributeClick();
          }}
          className="px-8 py-4 rounded-lg bg-gold text-white font-semibold text-base shadow-lg transition-all duration-300 hover:bg-gold-dark hover:shadow-xl hover:-translate-y-1 w-full"
        >
          Press Here to Contribute
        </button>
      </div>
    </ExpandableCard>
  );
};

// Card 4: Current Projects
export const CurrentProjectsCard = ({ 
  isExpanded, 
  onToggle, 
  index,
  projects = [] 
}: { 
  isExpanded: boolean; 
  onToggle: () => void; 
  index: number;
  projects?: { name: string; description: string }[] 
}) => {
  const defaultProjects = [
    {
      name: "Church Building Fund",
      description: "Renovating and expanding our worship facility to serve more members",
    },
    {
      name: "Youth Ministry Program",
      description: "Supporting spiritual growth and leadership development for young people",
    },
    {
      name: "Community Outreach",
      description: "Reaching out to those in need with food, shelter, and spiritual support",
    },
    {
      name: "Digital Ministry",
      description: "Expanding our online presence to reach more people with the Gospel",
    },
  ];

  const displayProjects = projects.length > 0 ? projects : defaultProjects;

  return (
    <ExpandableCard
      title="Current Projects"
      isExpanded={isExpanded}
      onToggle={onToggle}
      index={index}
    >
      <div className="space-y-4">
        <p className="text-white/90 leading-relaxed">
          Here are some of our current initiatives that your contributions support:
        </p>
        <div className="space-y-3">
          {displayProjects.slice(0, 4).map((project, idx) => (
            <div key={idx} className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <h4 className="font-semibold text-gold-light mb-1">{project.name}</h4>
              <p className="text-sm text-white/80">{project.description}</p>
            </div>
          ))}
        </div>
      </div>
    </ExpandableCard>
  );
};

