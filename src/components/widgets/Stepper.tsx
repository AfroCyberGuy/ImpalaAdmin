import { Check } from "lucide-react";

export type Step = {
  label: string;
};

type StepperProps = {
  steps: Step[];
  currentStep: number; // 0-indexed
};

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-start justify-between">
        {steps.map((step, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep;

          return (
            <li
              key={step.label}
              className="flex flex-1 flex-col items-center relative"
            >
              {/* connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-px transition-colors ${
                    isDone ? "bg-[#2E8B57]" : "bg-gray-200"
                  }`}
                />
              )}

              {/* circle */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all ${
                  isDone
                    ? "border-[#2E8B57] bg-[#2E8B57] text-white"
                    : isActive
                      ? "border-[#2E8B57] bg-[#2E8B57] text-white shadow-md shadow-[#2E8B57]/30"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : index + 1}
              </div>

              {/* label */}
              <span
                className={`mt-2 text-center text-xs leading-tight transition-colors ${
                  isActive
                    ? "font-semibold text-gray-900"
                    : isDone
                      ? "font-medium text-[#2E8B57]"
                      : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
