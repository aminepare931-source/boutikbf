import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";

type Message = {
  id: string;
  shop_id: string;
  employee_name: string;
  employee_role: string;
  message: string;
  created_at: string;
};

type EmployeeChatProps = {
  shopId: string;
  currentEmployeeName: string;
  currentEmployeeRole: string;
};

export function EmployeeChat({
  shopId,
  currentEmployeeName,
  currentEmployeeRole,
}: EmployeeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      cashier: "Vendeur",
      manager: "Gérant",
      accountant: "Comptable",
    };
    return labels[role] || role;
  };

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      cashier: "bg-primary/10 text-primary border-primary/20",
      manager: "bg-success/10 text-success border-success/20",
      accountant: "bg-warning/10 text-warning border-warning/20",
    };
    return colors[role] || "bg-muted text-muted-foreground";
  };

  useEffect(() => {
    if (!open) return;

    loadMessages();

    const channel = supabase
      .channel(`employee-chat-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "employee_messages",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("employee_messages" as any)
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Erreur chargement messages:", error);
    } else {
      setMessages((data ?? []) as Message[]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from("employee_messages" as any).insert({
        shop_id: shopId,
        employee_name: currentEmployeeName,
        employee_role: currentEmployeeRole,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Erreur envoi message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-primary shadow-elegant z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
            {messages.length > 9 ? "9+" : messages.length}
          </span>
        )}
      </Button>

      {open && (
        <Card className="fixed bottom-24 right-6 w-96 max-h-[500px] shadow-elegant z-50 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Chat équipe
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Messages internes de la boutique</p>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4 h-[300px]" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucun message pour l'instant</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envoyez le premier message à votre équipe
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.employee_name === currentEmployeeName;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{msg.employee_name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${roleColor(msg.employee_role)}`}
                          >
                            {roleLabel(msg.employee_role)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isMe
                              ? "bg-gradient-primary text-primary-foreground"
                              : "bg-muted border border-border"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Écrire un message..."
                  className="h-9 text-sm"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                  className="h-9 w-9 bg-gradient-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
