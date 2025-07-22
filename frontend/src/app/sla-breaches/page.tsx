'use client';

import { DashboardHeader } from '@/app/dashboard/_components/header';

export default function SLABreachesPage() {
  return (
    <div className="dashboard-container relative">
      {/* Very light stripe overlay - same pattern as dashboard */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" 
           style={{
             backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
           }}>
      </div>
      
      <div className="relative z-10">
        {/* Reuse dashboard header */}
        <DashboardHeader />
        
        {/* SLA Breaches content placeholder */}
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-2xl p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">SLA Breaches Dashboard</h1>
            <p className="text-muted-foreground mb-6">
              Monitor and manage SLA breaches across all workflows and tasks.
            </p>
            
            {/* Placeholder content */}
            <div className="bg-muted/50 rounded-lg p-12 border-2 border-dashed border-border">
              <div className="text-muted-foreground text-lg mb-2">🚧 Coming Soon</div>
              <div className="text-sm text-muted-foreground">
                SLA Breaches dashboard will be implemented here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}