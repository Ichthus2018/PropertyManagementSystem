// src/hooks/useSupabaseQuery.js
import { useState } from "react";
import useSWR from "swr";
import supabase from "../lib/supabase";

// The generic fetcher function, now accepts tableName and selectQuery
const fetcher = async ({
  tableName,
  selectQuery,
  page,
  searchTerm,
  searchColumn,
  pageSize,
}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(tableName).select(selectQuery, { count: "exact" });

  if (searchTerm && searchColumn) {
    query = query.ilike(searchColumn, `%${searchTerm}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("SWR Fetcher Error:", error);
    throw new Error(error.message || "Could not fetch data.");
  }

  return { data, count };
};

export const useSupabaseQuery = ({
  tableName,
  selectQuery = "*",
  searchColumn,
  initialPageSize = 5,
}) => {
  const [pageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const swrKey = {
    tableName,
    selectQuery,
    page: currentPage,
    searchTerm: activeSearchTerm,
    searchColumn,
    pageSize,
  };

  const {
    data: swrData,
    error,
    isLoading,
    mutate,
  } = useSWR(swrKey, fetcher, { keepPreviousData: true });

  const handleSearch = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setActiveSearchTerm(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  return {
    // SWR data
    data: swrData?.data || [],
    totalCount: swrData?.count || 0,
    isLoading,
    error,
    mutate, // To re-fetch data

    // Pagination state and handlers
    currentPage,
    setCurrentPage,
    pageCount: Math.ceil((swrData?.count || 0) / pageSize),
    pageSize,

    // Search state and handlers
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    handleSearch,
    clearSearch,
  };
};
