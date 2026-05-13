import { useEffect, useState } from "react";
import { api } from "../../api.js";
import "./ClearSummaries.css";

const clearOptions = [
  { label: "Last 24 Hours", value: "24hrs" },
  { label: "Last 7 Days", value: "7days" },
  { label: "Last Month", value: "month" },
  { label: "All Time", value: "all" }
];

export default function ClearSummaries({ onCleared }) {
  const [filter, setFilter] = useState("24hrs");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("success");

  useEffect(() => {
    if (!status || loading) return undefined;

    const timeout = window.setTimeout(() => {
      setStatus("");
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [loading, status]);

  async function handleClearSummaries() {
    setLoading(true);
    setStatusType("success");
    setStatus("Clearing summaries...");

    try {
      const result = await api.clearSummaries(filter);
      setStatusType("success");
      setStatus(`${result.deletedCount} summaries deleted.`);
      await onCleared?.();
    } catch (error) {
      setStatusType("error");
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="clear-summaries" aria-labelledby="clear-summaries-title">
      <div className="clear-summaries-header">
        <div>
          <p className="clear-summaries-eyebrow">Summary storage</p>
          <h3 id="clear-summaries-title">Clear Summaries</h3>
        </div>
      </div>

      <div className="clear-summaries-controls">
        <label className="clear-summaries-label" htmlFor="clear-summaries-filter">
          Time range
        </label>
        <div className="clear-summaries-action-row">
          <select
            id="clear-summaries-filter"
            className="clear-summaries-select"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {clearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            className="clear-summaries-button"
            type="button"
            disabled={loading}
            onClick={handleClearSummaries}
          >
            {loading ? (
              <span className="clear-summaries-spinner" aria-hidden="true" />
            ) : null}
            {loading ? "Clearing..." : "Clear Summaries"}
          </button>
        </div>
      </div>

      {status ? (
        <p
          className={`clear-summaries-status ${statusType}`}
          role={statusType === "error" ? "alert" : "status"}
        >
          {status}
        </p>
      ) : null}
    </section>
  );
}
