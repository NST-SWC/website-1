"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { JoinClubForm } from "@/components/forms/join-club-form";

type ModalProps = {
  open: boolean;
  onClose: () => void;
};

export const JoinClubModal = ({ open, onClose }: ModalProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="glass-panel relative w-full max-w-3xl border border-white/10 p-4 sm:p-6 md:p-8 my-4 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:text-white z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-4 sm:mb-6 space-y-2">
            <span className="inline-flex items-center rounded-full border border-orange-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              Join DevForge
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold">
              Tell us how you want to collaborate
            </h3>
            <p className="text-sm text-white/70">
              Once submitted, the admin desk reviews your request, tags mentors,
              and sends you portal access.
            </p>
          </div>
          <JoinClubForm onSuccess={onClose} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
