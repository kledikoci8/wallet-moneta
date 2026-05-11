import { useMemo, useState, useCallback } from "react";

const SORTS = ["newest", "oldest", "highest", "lowest"];

export function useTransactionFilters(transactions) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sort, setSort] = useState("newest");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [dateRangeEnabled, setDateRangeEnabled] = useState(false);

  const clearAll = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter(null);
    setSort("newest");
    setDateFrom(null);
    setDateTo(null);
    setDateRangeEnabled(false);
  }, []);

  const filtered = useMemo(() => {
    let list = [...(transactions || [])];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          String(t.title).toLowerCase().includes(q) ||
          String(t.category).toLowerCase().includes(q)
      );
    }

    if (typeFilter === "income") {
      list = list.filter((t) => parseFloat(t.amount) > 0);
    } else if (typeFilter === "expense") {
      list = list.filter((t) => parseFloat(t.amount) < 0);
    }

    if (categoryFilter) {
      list = list.filter((t) => t.category === categoryFilter);
    }

    if (dateRangeEnabled && (dateFrom || dateTo)) {
      list = list.filter((t) => {
        const d = new Date(t.created_at);
        d.setHours(0, 0, 0, 0);
        if (dateFrom) {
          const f = new Date(dateFrom);
          f.setHours(0, 0, 0, 0);
          if (d < f) return false;
        }
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      });
    }

    if (sort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "oldest") {
      list.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "highest") {
      list.sort(
        (a, b) => Math.abs(parseFloat(b.amount)) - Math.abs(parseFloat(a.amount))
      );
    } else if (sort === "lowest") {
      list.sort(
        (a, b) => Math.abs(parseFloat(a.amount)) - Math.abs(parseFloat(b.amount))
      );
    }

    return list;
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    sort,
    dateFrom,
    dateTo,
    dateRangeEnabled,
  ]);

  const hasActiveFilters =
    !!search.trim() ||
    typeFilter !== "all" ||
    !!categoryFilter ||
    sort !== "newest" ||
    dateRangeEnabled;

  return {
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    sort,
    setSort,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    dateRangeEnabled,
    setDateRangeEnabled,
    filtered,
    clearAll,
    hasActiveFilters,
    sortOptions: SORTS,
  };
}
