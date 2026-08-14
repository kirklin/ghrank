import kirklin from "@kirklin/eslint-config";

export default kirklin(
  {
    typescript: true,
    react: true,
    ignores: ["data/**", "web/public/**", "web/.next/**", "web/out/**", ".cache/**"],
  },
  {
    files: ["web/**/*.{ts,tsx,mjs}"],
    rules: {
      "node/prefer-global/process": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["web/components/LangProvider.tsx", "web/components/ThemeSwitch.tsx"],
    rules: {
      "react/set-state-in-effect": "off",
    },
  },
);
