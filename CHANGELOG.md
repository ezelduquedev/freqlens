# Changelog

## [1.0.0] - 2026-05-20

### Added
- Integrated custom preset icons in SVG format (`custom_1.svg` to `custom_4.svg`) in the `public/preset-icons/` directory.
- Re-added the "Música Pop" preset default icon (`pop.svg`).
- Created a `CHANGELOG.md` file at the root of the project to document modifications.

### Changed
- Swapped icon metadata IDs and names mapping in `EQPresets.tsx` (`custom_1` to 'Auriculares' and `custom_2` to 'Escudo') to ensure accurate association of names with their actual visual graphics.
- Updated image selectors to load `.svg` versions of custom icons for compatibility and consistent scaling across devices.
- Refactored `EQPresets.tsx` styling for modern look and light mode compatibility:
  - Preset cards and room profiles are styled with a white background (`bg-white`), a subtle shadow (`shadow-sm`), and unified border radius (`rounded-xl`).
  - Added support for dark mode surface colors using custom `--color-surface` and `--color-surfaceVariant` tokens.
  - Refined modal containers, inputs, buttons, and close/cancel options in modals to support clear white layouts in light theme, and seamless dark layouts (`bg-[#11141c]/95`) in dark theme.
- Configured theme color variables (`--color-surface` and `--color-surfaceVariant`) in `src/index.css` `@theme` block.
