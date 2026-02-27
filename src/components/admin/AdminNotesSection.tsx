"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

interface AdminNotesSectionProps {
  bookingId: string;
  initialNotes: string | null;
  onNotesUpdated?: () => void;
}

export default function AdminNotesSection({
  bookingId,
  initialNotes,
  onNotesUpdated,
}: AdminNotesSectionProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ admin_notes: notes.trim() || null })
        .eq("id", bookingId);

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      onNotesUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Notes</h2>
      <p className="text-xs text-gray-500 mb-3">
        Internal notes only - not visible to customers
      </p>

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          Notes saved successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        className="w-full rounded border border-gray-300 px-3 py-2 mb-4 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Add internal notes about this booking..."
      />

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Notes"}
      </Button>
    </div>
  );
}
