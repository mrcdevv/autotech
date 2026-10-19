import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import dayjs from "dayjs";

import { AppointmentCard } from "./AppointmentCard";

import type { Dayjs } from "dayjs";
import type { AppointmentResponse } from "@/types/appointment";

const SNAP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;
const DRAG_THRESHOLD_PX = 3;
const EXPANDED_MIN_HEIGHT = 96;

interface CalendarEventBlockProps {
  appointment: AppointmentResponse;
  top: number;
  height: number;
  left: string;
  width: string;
  zIndex: number;
  groupSize: number;
  dateStr: string;
  startHour: number;
  endHour: number;
  hourHeight: number;
  onClick: (appointment: AppointmentResponse) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, appointment: AppointmentResponse) => void;
  onReschedule?: (id: number, startTime: string, endTime: string) => void;
}

type DragMode = "move" | "resize";

export function CalendarEventBlock({
  appointment,
  top,
  height,
  left,
  width,
  zIndex,
  groupSize,
  dateStr,
  startHour,
  endHour,
  hourHeight,
  onClick,
  onMenuOpen,
  onReschedule,
}: CalendarEventBlockProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ startY: number; mode: DragMode; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [drag, setDrag] = useState<{ mode: DragMode; deltaPx: number } | null>(null);

  const pxPerMin = hourHeight / 60;
  const snapPx = pxPerMin * SNAP_MINUTES;
  const snap = (raw: number) => Math.round(raw / snapPx) * snapPx;

  // Only scheduled appointments can be moved or resized; completed and
  // cancelled ones behave as plain clickable cards.
  const canReschedule = Boolean(onReschedule) && appointment.status === "SCHEDULED";

  const capturePointer = (pointerId: number) => {
    try {
      wrapperRef.current?.setPointerCapture?.(pointerId);
    } catch {
      // capture is best effort; the window listener below still ends the gesture
    }
  };

  const releasePointer = (pointerId: number) => {
    try {
      wrapperRef.current?.releasePointerCapture?.(pointerId);
    } catch {
      // pointer capture may already be released
    }
  };

  const cancelGesture = () => {
    gestureRef.current = null;
    suppressClickRef.current = false;
    setDrag(null);
  };

  // Safety net: a pointer released or cancelled anywhere (e.g. outside the card
  // before capture took effect) must never leave a gesture pending.
  useEffect(() => {
    const handleWindowPointerEnd = () => {
      if (!gestureRef.current) return;
      gestureRef.current = null;
      suppressClickRef.current = false;
      setDrag(null);
    };
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);
    return () => {
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, []);

  const beginGesture = (mode: DragMode) => (e: React.PointerEvent<HTMLElement>) => {
    if (!canReschedule) return;
    // Let interactive controls (menu button) work natively.
    if ((e.target as HTMLElement).closest("button")) {
      suppressClickRef.current = false;
      return;
    }
    e.stopPropagation();
    suppressClickRef.current = true;
    gestureRef.current = { startY: e.clientY, mode, moved: false };
    capturePointer(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const g = gestureRef.current;
    if (!g) return;
    // No button pressed means the release was missed: drop the gesture unsaved.
    if (e.buttons === 0) {
      releasePointer(e.pointerId);
      cancelGesture();
      return;
    }
    const raw = e.clientY - g.startY;
    if (!g.moved && Math.abs(raw) > DRAG_THRESHOLD_PX) g.moved = true;
    if (g.moved) setDrag({ mode: g.mode, deltaPx: snap(raw) });
  };

  const endGesture = (e: React.PointerEvent<HTMLElement>, cancelled: boolean) => {
    const g = gestureRef.current;
    if (!g) return;
    gestureRef.current = null;
    setDrag(null);
    releasePointer(e.pointerId);

    if (!g.moved) {
      // A plain click on the card opens the detail; on the resize strip it does nothing.
      if (!cancelled && g.mode === "move") onClick(appointment);
      return;
    }

    if (!onReschedule) return;

    const minutesDelta = snap(e.clientY - g.startY) / pxPerMin;
    if (minutesDelta === 0) return;

    const baseStart = dayjs(appointment.startTime);
    const baseEnd = dayjs(appointment.endTime);
    const dayStart = dayjs(dateStr).hour(startHour).minute(0).second(0);
    const dayEnd = dayjs(dateStr).hour(endHour).minute(0).second(0);

    let newStart: Dayjs;
    let newEnd: Dayjs;

    if (g.mode === "move") {
      const duration = baseEnd.diff(baseStart, "minute");
      newStart = baseStart.add(minutesDelta, "minute");
      newEnd = newStart.add(duration, "minute");
      if (newStart.isBefore(dayStart)) {
        newStart = dayStart;
        newEnd = newStart.add(duration, "minute");
      }
      if (newEnd.isAfter(dayEnd)) {
        newEnd = dayEnd;
        newStart = newEnd.subtract(duration, "minute");
      }
    } else {
      newStart = baseStart;
      newEnd = baseEnd.add(minutesDelta, "minute");
      const minEnd = baseStart.add(MIN_DURATION_MINUTES, "minute");
      if (newEnd.isAfter(dayEnd)) newEnd = dayEnd;
      if (newEnd.isBefore(minEnd)) newEnd = minEnd;
    }

    if (newStart.isSame(baseStart) && newEnd.isSame(baseEnd)) return;

    onReschedule(
      appointment.id,
      newStart.format("YYYY-MM-DDTHH:mm:ss"),
      newEnd.format("YYYY-MM-DDTHH:mm:ss"),
    );
  };

  const dragMode = drag?.mode;
  const dragDelta = drag?.deltaPx ?? 0;
  const previewTop = top + (dragMode === "move" ? dragDelta : 0);
  const previewHeight = Math.max(
    height + (dragMode === "resize" ? dragDelta : 0),
    MIN_DURATION_MINUTES * pxPerMin,
  );

  return (
    <Box
      ref={wrapperRef}
      onPointerDown={beginGesture("move")}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => endGesture(e, false)}
      onPointerCancel={(e) => endGesture(e, true)}
      onClickCapture={(e) => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      sx={{
        position: "absolute",
        top: previewTop,
        left,
        width,
        height: previewHeight,
        zIndex: drag ? 100 : zIndex,
        transition: drag ? "none" : "all 0.15s ease-in-out",
        userSelect: "none",
        touchAction: canReschedule ? "none" : "auto",
        "&:hover":
          groupSize > 1 && !drag
            ? { zIndex: 50, width: "calc(100% - 8px)", left: "4px" }
            : {},
      }}
    >
      <AppointmentCard
        appointment={appointment}
        showFullTags={false}
        expanded={previewHeight >= EXPANDED_MIN_HEIGHT}
        onClick={onClick}
        onMenuOpen={onMenuOpen}
      />
      {canReschedule && (
        <Box
          data-testid="appointment-resize-handle"
          onPointerDown={beginGesture("resize")}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 8,
            cursor: "ns-resize",
            zIndex: 3,
          }}
        />
      )}
    </Box>
  );
}
