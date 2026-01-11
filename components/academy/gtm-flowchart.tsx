'use client'

export default function GTMFlowchart() {
  return (
    <div className="w-full bg-gradient-to-br from-blue-950/50 to-blue-900/30 border border-blue-500/20 rounded-xl p-8">
      <h3 className="text-xl font-semibold mb-6 text-white text-center">
        What GTM Actually Means in 2025
      </h3>
      
      <div className="relative">
        <svg viewBox="0 0 800 600" className="w-full h-auto">
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Top Left: Publish Content */}
          <g>
            <rect x="20" y="20" width="180" height="80" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="110" y="50" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              Publish High-Performing
            </text>
            <text x="110" y="70" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              LinkedIn/Blog Content
            </text>
            <circle cx="50" cy="45" r="8" fill="white" opacity="0.3" />
            <circle cx="170" cy="45" r="8" fill="white" opacity="0.3" />
            <circle cx="110" cy="75" r="8" fill="white" opacity="0.3" />
          </g>
          
          {/* Top Right: Capture Users */}
          <g>
            <rect x="600" y="20" width="180" height="80" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="690" y="50" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              Capture Engaged Users
            </text>
            <text x="690" y="70" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              (Web & Social)
            </text>
            <circle cx="630" cy="45" r="8" fill="white" opacity="0.3" />
            <circle cx="750" cy="45" r="8" fill="white" opacity="0.3" />
            <circle cx="690" cy="75" r="8" fill="white" opacity="0.3" />
          </g>
          
          {/* Left Flow: Enrich & Score */}
          <g>
            <path d="M 110 100 Q 200 150 250 200" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <rect x="200" y="180" width="150" height="60" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="275" y="205" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
              Enrich & Score Leads
            </text>
            <circle cx="220" cy="200" r="6" fill="white" opacity="0.3" />
            <circle cx="330" cy="200" r="6" fill="white" opacity="0.3" />
            <circle cx="275" cy="220" r="6" fill="white" opacity="0.3" />
          </g>
          
          {/* Right Flow: Ingest Leads */}
          <g>
            <path d="M 690 100 Q 600 150 550 200" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <rect x="450" y="180" width="150" height="60" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="525" y="205" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
              Ingest Leads into
            </text>
            <text x="525" y="225" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
              Central System
            </text>
            <circle cx="470" cy="200" r="6" fill="white" opacity="0.3" />
            <circle cx="580" cy="200" r="6" fill="white" opacity="0.3" />
          </g>
          
          {/* Central: AI Quality & Tier */}
          <g>
            <path d="M 275 240 L 400 280" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <path d="M 525 240 L 400 280" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <rect x="300" y="260" width="200" height="60" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="400" y="285" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              AI Quality & Tier Leads
            </text>
            <circle cx="320" cy="280" r="6" fill="white" opacity="0.3" />
            <circle cx="480" cy="280" r="6" fill="white" opacity="0.3" />
            <circle cx="400" cy="300" r="6" fill="white" opacity="0.3" />
          </g>
          
          {/* Push to CRM */}
          <g>
            <path d="M 400 320 L 400 380" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <rect x="300" y="360" width="200" height="60" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="400" y="385" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              Push to CRM &
            </text>
            <text x="400" y="405" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              Automate Actions
            </text>
            <circle cx="320" cy="380" r="6" fill="white" opacity="0.3" />
            <circle cx="480" cy="380" r="6" fill="white" opacity="0.3" />
            <circle cx="400" cy="400" r="6" fill="white" opacity="0.3" />
          </g>
          
          {/* Split: Monitor & Trigger */}
          <g>
            <path d="M 300 420 L 200 480" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <path d="M 500 420 L 600 480" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            
            <rect x="120" y="460" width="160" height="60" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="200" y="485" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
              Monitor Engagement
            </text>
            <circle cx="140" cy="480" r="6" fill="white" opacity="0.3" />
            <circle cx="260" cy="480" r="6" fill="white" opacity="0.3" />
            
            <rect x="520" y="460" width="160" height="60" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="600" y="485" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
              Trigger Outreach
            </text>
            <text x="600" y="505" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
              Campaign
            </text>
            <circle cx="540" cy="480" r="6" fill="white" opacity="0.3" />
            <circle cx="660" cy="480" r="6" fill="white" opacity="0.3" />
            <circle cx="600" cy="500" r="6" fill="white" opacity="0.3" />
          </g>
          
          {/* Reply Agent */}
          <g>
            <path d="M 600 520 L 600 560" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <rect x="520" y="540" width="160" height="50" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="600" y="565" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">
              Reply Agent
            </text>
            <circle cx="600" cy="560" r="8" fill="white" opacity="0.3" />
          </g>
          
          {/* Final: Meetings Booked / ROI */}
          <g>
            <path d="M 600 590 L 400 590" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <rect x="250" y="570" width="300" height="50" rx="8" fill="url(#blueGradient)" filter="url(#glow)" />
            <text x="400" y="595" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">
              Meetings Booked / ROI
            </text>
            <circle cx="270" cy="590" r="8" fill="white" opacity="0.3" />
            <circle cx="530" cy="590" r="8" fill="white" opacity="0.3" />
            <circle cx="400" cy="600" r="8" fill="white" opacity="0.3" />
          </g>
          
          {/* Arrow marker definition */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  )
}

