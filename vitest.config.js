import { defineConfig, configDefaults } from 'vitest/config';

// Los tests son solo los de tests/ de este proyecto (no los de las copias de trabajo en .claude/worktrees)
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
