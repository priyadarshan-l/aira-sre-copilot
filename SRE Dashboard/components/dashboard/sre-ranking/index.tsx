import { Badge } from "@/components/ui/badge";
import DashboardCard from "@/components/dashboard/card";
import type { TeamRanking } from "@/types/dashboard";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SreRankingProps {
  rankings: TeamRanking[];
}

export default function SreRanking({ rankings }: SreRankingProps) {
  return (
    <DashboardCard
      title="SRE CONTRIBUTIONS"
      intent="default"
      addon={<Badge variant="outline-warning">2 ACTIVE</Badge>}
    >
      <div className="space-y-4">
        {rankings.map((member) => (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-1 w-full">
              <div
                className={cn(
                  "flex items-center justify-center rounded text-sm font-bold px-1.5 mr-1 md:mr-2",
                  member.featured
                    ? "h-10 bg-primary text-primary-foreground"
                    : "h-8 bg-secondary text-secondary-foreground"
                )}
              >
                {member.id}
              </div>
              <div
                className={cn(
                  "rounded-lg overflow-hidden bg-muted",
                  member.featured ? "size-14 md:size-16" : "size-10 md:size-12"
                )}
              >
                {member.avatar ? (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div
                className={cn(
                  "flex flex-1 h-full items-center justify-between py-2 px-2.5 rounded",
                  member.featured && "bg-accent"
                )}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "font-display",
                          member.featured
                            ? "text-xl md:text-2xl"
                            : "text-lg md:text-xl"
                        )}
                      >
                        {member.name}
                      </span>
                      <span className="text-muted-foreground text-xs md:text-sm">
                        {member.handle}
                      </span>
                    </div>
                    <Badge variant={member.featured ? "default" : "secondary"}>
                      {member.points} PTS
                    </Badge>
                  </div>
                  {member.subtitle && (
                    <span className="text-sm text-muted-foreground italic">
                      {member.subtitle}
                    </span>
                  )}
                  {member.streak && !member.featured && (
                    <span className="text-sm text-muted-foreground italic">
                      {member.streak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
