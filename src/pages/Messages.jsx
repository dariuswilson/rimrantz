import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function Messages({
  user,
  username,
  userBucks,
  onProfileClick,
  onLogout,
  onViewProfile,
  onBack,
  initialConvo,
}) {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null); // { username, user_id }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const fetchAvatarUrl = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .single();
    setAvatarUrl(data?.avatar_url || null);
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    const convMap = {};
    data.forEach((msg) => {
      const partnerId =
        msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const partnerUsername =
        msg.sender_id === user.id ? msg.receiver_username : msg.sender_username;
      if (!convMap[partnerId]) {
        convMap[partnerId] = {
          user_id: partnerId,
          username: partnerUsername,
          lastMessage: msg,
          unread: 0,
          avatar_url: null,
        };
      }
      if (msg.receiver_id === user.id && !msg.read) {
        convMap[partnerId].unread++;
      }
    });

    // Fetch avatars for all partners
    const partnerIds = Object.keys(convMap);
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, avatar_url")
        .in("user_id", partnerIds);
      profiles?.forEach((p) => {
        if (convMap[p.user_id]) convMap[p.user_id].avatar_url = p.avatar_url;
      });
    }

    setConversations(Object.values(convMap));
    setLoading(false);
  };

  const fetchMessages = async (partnerId) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true });
    setMessages(data || []);

    // Mark as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", partnerId)
      .eq("read", false);
  };

  useEffect(() => {
    const init = async () => {
      await fetchAvatarUrl();
      await fetchConversations();
      if (initialConvo) {
        setTimeout(() => setActiveConvo(initialConvo), 0);
      }
    };
    init();

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchConversations();
          if (activeConvo) fetchMessages(activeConvo.user_id);
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    const load = async () => {
      await fetchMessages(activeConvo.user_id);
    };
    load();
  }, [activeConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo) return;
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activeConvo.user_id,
      sender_username: username,
      receiver_username: activeConvo.username,
      content: newMessage.trim(),
    });
    setNewMessage("");
    await fetchMessages(activeConvo.user_id);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#080810" }}>
      <Navbar
        username={username}
        avatarUrl={avatarUrl}
        userBucks={userBucks}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        onViewProfile={onViewProfile}
      />

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-xl text-sm transition cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717a",
            }}
          >
            ← Back
          </button>
          <h1 className="text-white font-bold text-xl">💬 Messages</h1>
        </div>

        <div className="flex gap-4 h-[600px]">
          {/* Conversation list */}
          <div
            className="w-72 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="p-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <p className="text-white font-semibold text-sm">Conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <p className="text-zinc-500 text-sm p-4">Loading...</p>
              )}
              {!loading && conversations.length === 0 && (
                <div className="text-center p-6">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-zinc-500 text-xs">
                    No messages yet. Visit someone's profile to DM them!
                  </p>
                </div>
              )}
              {conversations.map((convo) => (
                <div
                  key={convo.user_id}
                  onClick={() => setActiveConvo(convo)}
                  className="flex items-center gap-3 p-4 cursor-pointer transition"
                  style={{
                    background:
                      activeConvo?.user_id === convo.user_id
                        ? "rgba(249,115,22,0.1)"
                        : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black flex-shrink-0 overflow-hidden">
                    {convo.avatar_url ? (
                      <img
                        src={convo.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      convo.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-semibold truncate">
                        @{convo.username}
                      </p>
                      {convo.unread > 0 && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "#f97316", color: "white" }}
                        >
                          {convo.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs truncate mt-0.5">
                      {convo.lastMessage.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message area */}
          <div
            className="flex-1 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl mb-4">💬</p>
                  <p className="text-zinc-500">
                    Select a conversation or DM someone from their profile
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div
                  className="flex items-center gap-3 p-4 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black overflow-hidden">
                    {activeConvo.avatar_url ? (
                      <img
                        src={activeConvo.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeConvo.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <p
                      className="text-white font-semibold text-sm cursor-pointer hover:text-orange-400 transition"
                      onClick={() => onViewProfile(activeConvo.username)}
                    >
                      @{activeConvo.username}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                          style={{
                            background: isMine
                              ? "linear-gradient(135deg, #f97316, #ef4444)"
                              : "rgba(255,255,255,0.08)",
                            color: "white",
                            borderRadius: isMine
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                          }}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className="text-xs mt-1 opacity-60">
                            {new Date(msg.created_at).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div
                  className="p-4 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder={`Message @${activeConvo.username}...`}
                      className="flex-1 text-white text-sm px-4 py-3 rounded-xl outline-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-5 py-3 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40"
                      style={{
                        background: "linear-gradient(135deg, #f97316, #ef4444)",
                        color: "white",
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
