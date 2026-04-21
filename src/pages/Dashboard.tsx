import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession, clearSession, AuthSession } from "@/lib/auth";
import { LogOut, User } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const session: AuthSession | null = getSession();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  const handleLogout = () => {
    clearSession();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Toka
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Taarifa za Mtumiaji
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Jina:</span>
              <span className="font-medium text-foreground">{session.user?.full_name || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Simu:</span>
              <span className="font-medium text-foreground">{session.user?.phone || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Nafasi:</span>
              <span className="font-medium text-foreground capitalize">{session.user?.role || "user"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token Inaisha:</span>
              <span className="font-medium text-foreground text-sm">
                {session.expires_at ? new Date(session.expires_at).toLocaleDateString("sw-TZ") : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
