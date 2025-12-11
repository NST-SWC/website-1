"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { availableInterests } from "@/lib/data";
import type { JoinRequestPayload } from "@/types";
import { Button } from "@/components/ui/button";
import { submitJoinRequest } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  displayName: z.string().min(2, "Tell us your name."),
  email: z.string().email("Use a valid email."),
  phone: z.string().min(8, "Add a contact number."),
  github: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  goals: z.string().min(20, "Share more about what you want to build."),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  role: z.enum(["student", "mentor", "alumni"]),
  availability: z
    .string()
    .min(5, "Let us know when you are usually free.")
    .max(60),
  interests: z.array(z.string()).min(1, "Pick at least one interest."),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  displayName: "",
  email: "",
  phone: "",
  github: "",
  portfolio: "",
  goals: "",
  experience: "intermediate",
  role: "student",
  availability: "Weeknights + Weekends",
  interests: ["Web Apps"],
};

export const JoinClubForm = ({
  onSuccess,
}: {
  onSuccess?: () => void;
}) => {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const interests =
    (useWatch({
      control,
      name: "interests",
    }) as string[]) ?? [];

  const toggleInterest = (interest: string) => {
    const next = interests.includes(interest)
      ? interests.filter((item) => item !== interest)
      : [...interests, interest];
    setValue("interests", next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    setStatus("idle");
    setMessage(null);
    const payload: JoinRequestPayload = {
      ...values,
      github: values.github || undefined,
      portfolio: values.portfolio || undefined,
    };
    const result = await submitJoinRequest(payload);
    if (result.ok) {
      setStatus("success");
      setMessage(result.message);
      reset(defaultValues);
      onSuccess?.();
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 text-left"
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Full Name"
          error={errors.displayName?.message}
          inputProps={{ ...register("displayName"), placeholder: "Sasha Dev" }}
        />
        <Field
          label="Email"
          error={errors.email?.message}
          inputProps={{
            ...register("email"),
            type: "email",
            placeholder: "you@campus.dev",
          }}
        />
        <Field
          label="Phone / WhatsApp"
          error={errors.phone?.message}
          inputProps={{
            ...register("phone"),
            placeholder: "+91 9876543210",
          }}
        />
        <Field
          label="Availability"
          error={errors.availability?.message}
          inputProps={{
            ...register("availability"),
            placeholder: "Weeknights, Sat mornings",
          }}
        />
        <Field
          label="GitHub"
          error={errors.github?.message}
          inputProps={{
            ...register("github"),
            placeholder: "https://github.com/you",
          }}
        />
        <Field
          label="Portfolio / Case Study"
          error={errors.portfolio?.message}
          inputProps={{
            ...register("portfolio"),
            placeholder: "https://www.behance.net/you",
          }}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-white/90">
          Interest Tracks
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableInterests.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-all",
                  active
                    ? "border-transparent bg-[#00f5c4] text-black"
                    : "border-white/20 text-white/70 hover:border-[#00f5c4]/60 hover:text-white",
                )}
              >
                {interest}
              </button>
            );
          })}
        </div>
        {errors.interests?.message && (
          <p className="mt-1 text-xs text-red-400">
            {errors.interests.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Experience Level"
          error={errors.experience?.message}
          component={
            <select
              {...register("experience")}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 focus:border-[#00f5c4] focus:outline-none"
            >
              <option value="beginner">Just getting started</option>
              <option value="intermediate">Building consistently</option>
              <option value="advanced">Leading builds / mentoring</option>
            </select>
          }
        />
        <Field
          label="How would you like to engage?"
          error={errors.role?.message}
          component={
            <select
              {...register("role")}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 focus:border-[#00f5c4] focus:outline-none"
            >
              <option value="student">Student Builder</option>
              <option value="mentor">Mentor</option>
              <option value="alumni">Alumni Contributor</option>
            </select>
          }
        />
      </div>

      <Field
        label="What do you want to build with the club?"
        error={errors.goals?.message}
        component={
          <textarea
            {...register("goals")}
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 focus:border-[#00f5c4] focus:outline-none"
            placeholder="Tell us about the kind of projects, stacks, or problems you want to dive into..."
          />
        }
      />

      <Button
        type="submit"
        className="w-full text-base"
        disabled={isSubmitting}
        glow
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending to admin desk...
          </>
        ) : (
          "Send Join Request"
        )}
      </Button>

      <motion.p
        initial={{ opacity: 0, y: -6 }}
        animate={{
          opacity: status === "success" || status === "error" ? 1 : 0,
          y: status === "success" || status === "error" ? 0 : -6,
        }}
        className={cn(
          "text-sm",
          status === "success" ? "text-orange-400" : "text-red-400",
        )}
      >
        {message}
      </motion.p>
    </form>
  );
};

type FieldProps = {
  label: string;
  error?: string;
  component?: React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const Field = ({ label, error, component, inputProps }: FieldProps) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-white/80">{label}</label>
    {component ?? (
      <input
        {...inputProps}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 focus:border-[#00f5c4] focus:outline-none"
      />
    )}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);
