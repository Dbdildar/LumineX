import React, { useState, useEffect } from "react";
import { videoAPI } from "../lib/supabase";
import { C, SectionHeader, Skeleton } from "../components/ui/index";
import { CategoryCard } from "./HomePage"; 

// 1. Define the Card-style Ad (Looks like a Category Card)
const CategoryAdCard = () => (
  <div style={{
    borderRadius: 16, padding: "18px 14px", 
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    border: `1px solid ${C.border}`, textAlign: "center",
    display: "flex", flexDirection: "column", justifyContent: "center", height: "100%"
  }}>
    <div style={{ fontSize: 10, color: C.accent, fontWeight: 800, marginBottom: 8 }}>SPONSORED</div>
    <div id="ad-slot-grid" style={{ minHeight: 60 }} />
    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>Check this out</div>
  </div>
);

// 2. Define the Banner-style Ad (For the top)
const BannerAdUnit = ({ adKey }) => (
  <div key={adKey} style={{ margin: '20px 0', padding: '12px', background: C.bg3, borderRadius: '16px', border: `1px solid ${C.border}` }}>
    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Featured Recommendations</span>
    <div id="ad-slot-banner" style={{ marginTop: 10 }} />
  </div>
);

export default function CategoriesPage({ setCatFilter, setTab, setFilter }) {
  const [categories, setSetCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await videoAPI.getCategories();
        setSetCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCategoryClick = (name) => {
    if (setFilter) setFilter("all");
    setCatFilter(name);
    setTab("home");
  };

  return (
    <div style={{ padding: "20px 0" }}>
      <SectionHeader title="Explore Categories" />

      {/* 3. PLACEMENT: TOP BANNER (Refreshes every time page loads) */}
      {!loading && <BannerAdUnit adKey={categories.length} />}
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", 
        gap: 16,
        marginTop: 20 
      }}>
        {loading ? (
          Array(12).fill(0).map((_, i) => (
            <div key={i} style={{ height: 120, background: C.bg3, borderRadius: 16 }} />
          ))
        ) : (
          categories.map((cat, i) => (
            <React.Fragment key={cat}>
              <CategoryCard 
                name={cat} 
                onClick={() => handleCategoryClick(cat)} 
              />
              
              {/* 4. PLACEMENT: IN-GRID CARD AD (Appears after 5th Category) */}
              {i === 4 && <CategoryAdCard />}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
