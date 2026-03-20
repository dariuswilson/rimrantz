import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import ReportModal from "./ReportModal";

function GroupChatItem({ group, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-4 cursor-pointer transition"
      style={{
        background: isActive ? "rgba(249,115,22,0.1)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <img
          src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${group.id.toLowerCase()}.png`}
          alt={group.name}
          className="w-8 h-8"
          onError={(e) => (e.target.style.display = "none")}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-white text-sm font-semibold truncate">
            {group.name}
          </p>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2"
            style={{
              background: "rgba(249,115,22,0.15)",
              color: "#f97316",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            Group
          </span>
        </div>
        <p className="text-zinc-500 text-xs truncate mt-0.5">
          {group.lastMessage || "No messages yet"}
        </p>
      </div>
    </div>
  );
}

function ConversationList({
  conversations,
  loading,
  activeConvo,
  openConvo,
  groupChat,
  activeGroup,
  openGroup,
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
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
        {loading && <p className="text-zinc-500 text-sm p-4">Loading...</p>}

        {!loading && groupChat && (
          <>
            <div
              className="px-4 pt-3 pb-1"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider">
                Team Chat
              </p>
            </div>
            <GroupChatItem
              group={groupChat}
              isActive={activeGroup?.id === groupChat.id}
              onClick={() => openGroup(groupChat)}
            />
            {conversations.length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider">
                  Direct Messages
                </p>
              </div>
            )}
          </>
        )}

        {!loading && conversations.length === 0 && !groupChat && (
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
            onClick={() => openConvo(convo)}
            className="flex items-center gap-3 p-4 cursor-pointer transition"
            style={{
              background:
                activeConvo?.user_id === convo.user_id
                  ? "rgba(249,115,22,0.1)"
                  : "transparent",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black flex-shrink-0 overflow-hidden">
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
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2"
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
  );
}

function GroupChatView({
  group,
  messages,
  newMessage,
  setNewMessage,
  sendGroupMessage,
  setMobileView,
  user,
  bottomRef,
  members,
  showMembers,
  setShowMembers,
  onViewProfile,
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => setMobileView("list")}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          ←
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <img
            src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${group.id.toLowerCase()}.png`}
            alt={group.name}
            className="w-7 h-7"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{group.name}</p>
          <p className="text-zinc-500 text-xs">Team Chat</p>
        </div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
          style={{
            background: showMembers
              ? "rgba(249,115,22,0.2)"
              : "rgba(255,255,255,0.06)",
            border: showMembers
              ? "1px solid rgba(249,115,22,0.3)"
              : "1px solid rgba(255,255,255,0.08)",
            color: showMembers ? "#f97316" : "#71717a",
          }}
        >
          👥 {members.length}
        </button>
      </div>

      {showMembers && (
        <div
          className="p-4 border-b"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Members ({members.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div
                key={m.user_id}
                onClick={() => onViewProfile(m.username)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(249,115,22,0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
              >
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    m.username?.[0]?.toUpperCase()
                  )}
                </div>
                <span className="text-zinc-300 text-xs hover:text-orange-400 transition">
                  @{m.username}
                </span>
                {m.user_id === user.id && (
                  <span className="text-orange-400 text-xs">(you)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="group-messages flex-1 overflow-y-auto p-4 space-y-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#f97316 #1c1c1e" }}
      >
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}
            >
              {!isMine && (
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden self-end">
                  {msg.sender_avatar ? (
                    <img
                      src={msg.sender_avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    msg.sender_username?.[0]?.toUpperCase()
                  )}
                </div>
              )}
              <div
                className={`max-w-xs ${!isMine ? "items-start" : "items-end"} flex flex-col`}
              >
                {!isMine && (
                  <p
                    className="text-zinc-500 text-xs mb-1 ml-1 cursor-pointer hover:text-orange-400 transition"
                    onClick={() => onViewProfile(msg.sender_username)}
                  >
                    @{msg.sender_username}
                  </p>
                )}
                <div
                  className="px-4 py-2.5 text-sm"
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
                    {new Date(msg.created_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <style>{`.group-messages::-webkit-scrollbar{width:6px}.group-messages::-webkit-scrollbar-track{background:#1c1c1e;border-radius:999px}.group-messages::-webkit-scrollbar-thumb{background:#f97316;border-radius:999px}`}</style>

      <div
        className="p-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendGroupMessage()}
            placeholder={`Message ${group.name}...`}
            className="flex-1 text-white text-sm px-4 py-3 rounded-xl outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <button
            onClick={sendGroupMessage}
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
    </div>
  );
}

function ChatView({
  activeConvo,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  setMobileView,
  onViewProfile,
  user,
  bottomRef,
  onReport,
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {!activeConvo ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-zinc-500 text-sm">
              Select a conversation or DM someone from their profile
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex items-center gap-3 p-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => setMobileView("list")}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              ←
            </button>
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0">
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
            <p
              className="text-white font-semibold text-sm cursor-pointer hover:text-orange-400 transition flex-1"
              onClick={() => onViewProfile(activeConvo.username)}
            >
              @{activeConvo.username}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-1.5 group/msg`}
                >
                  <div
                    className="max-w-xs px-4 py-2.5 text-sm"
                    style={{
                      background: isMine
                        ? "linear-gradient(135deg, #f97316, #ef4444)"
                        : "rgba(255,255,255,0.08)",
                      color: "white",
                      borderRadius: isMine
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      order: isMine ? 2 : 1,
                    }}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {/* Report button on others' messages */}
                  {!isMine && (
                    <button
                      onClick={() => onReport(msg)}
                      className="opacity-0 group-hover/msg:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition cursor-pointer flex-shrink-0 mb-1"
                      style={{ order: 2 }}
                      title="Report message"
                    >
                      🚩
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

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
  );
}

export default function Messages({
  user,
  username,
  userBucks,
  onProfileClick,
  onLogout,
  onViewProfile,
  onBack,
  initialConvo,
  onMessagesClick,
  unreadCount,
  onBucksClick,
  isModerator,
  onModPanelClick,
  onUnreadUpdate,
}) {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState("list");
  const [groupChat, setGroupChat] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [reportModal, setReportModal] = useState(null);
  const bottomRef = useRef(null);

  const fetchAvatarUrl = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, favorite_team")
      .eq("user_id", user.id)
      .single();
    setAvatarUrl(data?.avatar_url || null);
    return data?.favorite_team || null;
  };

  const fetchGroupChat = async (teamAbbr) => {
    if (!teamAbbr) return;
    const { data: group } = await supabase
      .from("team_groups")
      .select("*")
      .eq("id", teamAbbr)
      .single();
    if (!group) return;
    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("content")
      .eq("group_id", teamAbbr)
      .order("created_at", { ascending: false })
      .limit(1);
    setGroupChat({ ...group, lastMessage: lastMsgs?.[0]?.content || null });
    const { data: members } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .eq("favorite_team", teamAbbr);
    setGroupMembers(members || []);
  };

  const fetchGroupMessages = async (teamAbbr) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("group_id", teamAbbr)
      .order("created_at", { ascending: true });
    if (!data) return setGroupMessages([]);
    const senderIds = [...new Set(data.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, avatar_url")
      .in("user_id", senderIds);
    const avatarMap = {};
    profiles?.forEach((p) => (avatarMap[p.user_id] = p.avatar_url));
    setGroupMessages(
      data.map((m) => ({
        ...m,
        sender_avatar: avatarMap[m.sender_id] || null,
      })),
    );
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .is("group_id", null)
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
      if (msg.receiver_id === user.id && !msg.read) convMap[partnerId].unread++;
    });

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
      .is("group_id", null)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", partnerId)
      .eq("read", false);

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("read", false);

    if (onUnreadUpdate) onUnreadUpdate(count || 0);
    await fetchConversations();
  };

  useEffect(() => {
    const init = async () => {
      const favoriteTeam = await fetchAvatarUrl();
      await fetchConversations();
      if (favoriteTeam) await fetchGroupChat(favoriteTeam);
      if (initialConvo) {
        setActiveConvo(initialConvo);
        setMobileView("chat");
      }
    };
    init();

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          fetchConversations();
          if (payload.new.group_id) fetchGroupMessages(payload.new.group_id);
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
  }, [activeConvo?.user_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages]);

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

  const sendGroupMessage = async () => {
    if (!newMessage.trim() || !activeGroup) return;
    await supabase.from("messages").insert({
      sender_id: user.id,
      sender_username: username,
      receiver_id: user.id,
      receiver_username: username,
      group_id: activeGroup.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
    await fetchGroupMessages(activeGroup.id);
  };

  const openConvo = (convo) => {
    setActiveConvo(convo);
    setActiveGroup(null);
    setMobileView("chat");
  };
  const openGroup = async (group) => {
    setActiveGroup(group);
    setActiveConvo(null);
    setShowMembers(false);
    setMobileView("chat");
    await fetchGroupMessages(group.id);
  };

  const handleReportMessage = (msg) => {
    setReportModal({
      reportedUserId: msg.sender_id,
      reportedUsername: msg.sender_username,
      contentType: "comment",
      contentId: msg.id,
      contentPreview: msg.content,
    });
  };

  const isGroupActive = !!activeGroup;

  const sharedDMProps = {
    activeConvo,
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    setMobileView,
    onViewProfile,
    user,
    bottomRef,
    onReport: handleReportMessage,
  };
  const sharedGroupProps = {
    group: activeGroup,
    messages: groupMessages,
    newMessage,
    setNewMessage,
    sendGroupMessage,
    setMobileView,
    user,
    bottomRef,
    members: groupMembers,
    showMembers,
    setShowMembers,
    onViewProfile,
  };

  const chatPanel = isGroupActive ? (
    <GroupChatView {...sharedGroupProps} />
  ) : (
    <ChatView {...sharedDMProps} />
  );

  return (
    <div className="min-h-screen text-white" style={{ background: "#080810" }}>
      {/* Report Modal */}
      {reportModal && (
        <ReportModal
          reporter={user}
          reporterUsername={username}
          reportedUserId={reportModal.reportedUserId}
          reportedUsername={reportModal.reportedUsername}
          contentType={reportModal.contentType}
          contentId={reportModal.contentId}
          contentPreview={reportModal.contentPreview}
          onClose={() => setReportModal(null)}
        />
      )}

      <Navbar
        username={username}
        avatarUrl={avatarUrl}
        userBucks={userBucks}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        onViewProfile={onViewProfile}
        onMessagesClick={onMessagesClick}
        unreadCount={unreadCount}
        onBucksClick={onBucksClick}
        isModerator={isModerator}
        onModPanelClick={onModPanelClick}
      />

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
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

        <div className="hidden lg:flex gap-4 h-[600px]">
          <div className="w-72 flex-shrink-0">
            <ConversationList
              conversations={conversations}
              loading={loading}
              activeConvo={activeConvo}
              openConvo={openConvo}
              groupChat={groupChat}
              activeGroup={activeGroup}
              openGroup={openGroup}
            />
          </div>
          <div className="flex-1">{chatPanel}</div>
        </div>

        <div className="lg:hidden h-[75vh]">
          {mobileView === "list" ? (
            <ConversationList
              conversations={conversations}
              loading={loading}
              activeConvo={activeConvo}
              openConvo={openConvo}
              groupChat={groupChat}
              activeGroup={activeGroup}
              openGroup={openGroup}
            />
          ) : (
            chatPanel
          )}
        </div>
      </div>
    </div>
  );
}
