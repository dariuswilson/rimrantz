import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

const MAIN_SHOP_ITEMS = [
  // Placeholder for future items
];

const DISCORD_SHOP_ITEMS = [
  {
    id: "self_react",
    name: "SelfReacting",
    description:
      "Unlock the ability to self-react to your own messages in the NBA Zone Discord server.",
    price: 3000,
    icon: "⚡",
    category: "discord",
  },
];

export default function Shop({
  user,
  username,
  userBucks,
  onBucksUpdate,
  isModerator,
  onBack,
  onProfileClick,
  onMessagesClick,
  onBucksClick,
  onShopClick,
  unreadCount,
  onModPanelClick,
  onViewProfile,
  onLogout,
}) {
  const [purchasing, setPurchasing] = useState(null);
  const [successItem, setSuccessItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [ownedItems, setOwnedItems] = useState([]);

  useEffect(() => {
    const fetchOwned = async () => {
      const { data } = await supabase
        .from("shop_purchases")
        .select("item_id")
        .eq("user_id", user.id);
      if (data) setOwnedItems(data.map((p) => p.item_id));
    };
    fetchOwned();
  }, [user.id]);

  const handlePurchase = async (item) => {
    if (userBucks < item.price) {
      setErrorMsg("Not enough NBA Bucks!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setPurchasing(item.id);
    setErrorMsg("");

    try {
      const newBalance = userBucks - item.price;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ nba_bucks: newBalance })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      const { error: purchaseError } = await supabase
        .from("shop_purchases")
        .insert({
          user_id: user.id,
          item_id: item.id,
          item_name: item.name,
          price: item.price,
        });

      if (purchaseError) throw purchaseError;

      onBucksUpdate(newBalance);
      setOwnedItems((prev) => [...prev, item.id]);
      setSuccessItem(item);
      setTimeout(() => setSuccessItem(null), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Try again.");
      setTimeout(() => setErrorMsg(""), 3000);
    }

    setPurchasing(null);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#080810" }}>
      <Navbar
        username={username}
        userBucks={userBucks}
        onProfileClick={onProfileClick}
        onLogout={onLogout || (() => supabase.auth.signOut())}
        onViewProfile={onViewProfile}
        onMessagesClick={onMessagesClick}
        onBucksClick={onBucksClick}
        onShopClick={onShopClick}
        unreadCount={unreadCount}
        isModerator={isModerator}
        onModPanelClick={onModPanelClick}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition cursor-pointer mb-8"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#71717a",
          }}
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-3xl font-black mb-2"
            style={{
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🛍️ Shop
          </h1>
          <p className="text-zinc-500 text-sm">
            Spend your NBA Bucks on perks and upgrades
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mt-3"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            <span>💰</span>
            <span className="text-white font-bold text-sm">
              {userBucks?.toLocaleString()} NBA Bucks available
            </span>
          </div>
        </div>

        {/* Toasts */}
        {errorMsg && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm text-red-400"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}
        {successItem && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm text-green-400"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            ✅ Successfully purchased <strong>{successItem.name}</strong>!
          </div>
        )}

        {/* ── Main Shop ── */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-white">🏀 Main Shop</h2>
            <div
              className="h-px flex-1"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          {MAIN_SHOP_ITEMS.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-4xl mb-3">🔜</p>
              <p className="text-zinc-400 font-semibold">Coming soon</p>
              <p className="text-zinc-600 text-sm mt-1">
                Profile badges, avatar frames, and more dropping soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MAIN_SHOP_ITEMS.map((item) => (
                <ShopCard
                  key={item.id}
                  item={item}
                  userBucks={userBucks}
                  purchasing={purchasing}
                  owned={ownedItems.includes(item.id)}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Discord Shop ── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-bold text-white">🎮 Discord Perks</h2>
            <div
              className="h-px flex-1"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>
          <p className="text-zinc-600 text-xs mb-5">
            These perks apply to your account in the NBA Zone Discord server.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DISCORD_SHOP_ITEMS.map((item) => (
              <ShopCard
                key={item.id}
                item={item}
                userBucks={userBucks}
                purchasing={purchasing}
                owned={ownedItems.includes(item.id)}
                onPurchase={handlePurchase}
                discord
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ShopCard({ item, userBucks, purchasing, owned, onPurchase, discord }) {
  const canAfford = userBucks >= item.price;
  const isLoading = purchasing === item.id;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #151525 100%)",
        border: discord
          ? "1px solid rgba(88,101,242,0.25)"
          : "1px solid rgba(249,115,22,0.15)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: discord
              ? "rgba(88,101,242,0.15)"
              : "rgba(249,115,22,0.12)",
          }}
        >
          {item.icon}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{item.name}</p>
          {discord && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(88,101,242,0.2)", color: "#818cf8" }}
            >
              Discord
            </span>
          )}
        </div>
      </div>

      <p className="text-zinc-400 text-xs leading-relaxed flex-1">
        {item.description}
      </p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-base">💰</span>
          <span
            className="font-black text-sm"
            style={{ color: canAfford ? "#f97316" : "#71717a" }}
          >
            {item.price.toLocaleString()}
          </span>
        </div>

        <button
          onClick={() => !owned && !isLoading && canAfford && onPurchase(item)}
          disabled={isLoading || owned || !canAfford}
          className="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: owned
              ? "rgba(34,197,94,0.15)"
              : discord
                ? "linear-gradient(135deg, #6366f1, #818cf8)"
                : "linear-gradient(135deg, #f97316, #ef4444)",
            color: owned ? "#22c55e" : "white",
            pointerEvents: isLoading || owned ? "none" : "auto",
          }}
        >
          {owned
            ? "✓ Owned"
            : isLoading
              ? "Purchasing..."
              : !canAfford
                ? "Can't afford"
                : "Purchase"}
        </button>
      </div>
    </div>
  );
}
