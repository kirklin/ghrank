export type Lang = "en" | "zh";

export const LANGS: Lang[] = ["en", "zh"];

const dict = {
  "nav.users": { en: "Developers", zh: "用户" },
  "nav.repos": { en: "Repositories", zh: "仓库" },
  "nav.regions": { en: "Regions", zh: "地区" },
  "nav.languages": { en: "Languages", zh: "语言" },

  "home.title": { en: "GitHub Developer Ranking", zh: "GitHub 用户榜" },
  "home.allRegions": { en: "All regions", zh: "全部地区" },

  "repos.title": { en: "GitHub Repository Ranking", zh: "GitHub 仓库榜" },
  "repos.allLanguages": { en: "All languages", zh: "全部语言" },

  "countries.title": { en: "By Region", zh: "按地区" },
  "countries.region": { en: "Region", zh: "地区" },
  "countries.people": { en: "Developers", zh: "人数" },

  "languages.title": { en: "By Language", zh: "按语言" },
  "languages.language": { en: "Language", zh: "语言" },
  "languages.repos": { en: "Repositories", zh: "仓库数" },

  "country.title": { en: "{name} Developers", zh: "{name} 开发者榜" },

  "lang.title": { en: "{name} Repositories", zh: "{name} 仓库榜" },

  "table.rank": { en: "#", zh: "#" },
  "table.user": { en: "Developer", zh: "用户" },
  "table.followers": { en: "Followers", zh: "Followers" },
  "table.repos": { en: "Repos", zh: "仓库" },
  "table.location": { en: "Location", zh: "地区" },
  "table.company": { en: "Company", zh: "公司" },
  "table.repository": { en: "Repository", zh: "仓库" },
  "table.stars": { en: "Stars", zh: "Stars" },
  "table.forks": { en: "Forks", zh: "Forks" },
  "table.language": { en: "Language", zh: "语言" },
  "table.description": { en: "Description", zh: "简介" },
  "table.joined": { en: "Joined", zh: "加入" },
  "table.pushed": { en: "Last push", zh: "最近推送" },
  "table.sortHint": { en: "Sort by this column", zh: "点击按此列排序" },

  "search.users": { en: "Search by username, name, company, or city", zh: "搜用户名、姓名、公司、城市" },
  "search.repos": { en: "Search by name, description, or language", zh: "搜仓库名、简介、语言" },

  "count.loading": { en: "Loading the full dataset…", zh: "正在载入全部数据…" },
  "count.matchedUsers": { en: "{n} results", zh: "{n} 人" },
  "count.matchedRepos": { en: "{n} results", zh: "{n} 个" },
  "count.totalUsers": { en: "{n} developers", zh: "{n} 名开发者" },
  "count.totalRepos": { en: "{n} repositories", zh: "{n} 个仓库" },

  "card.followers": { en: "followers", zh: "粉丝" },
  "card.following": { en: "following", zh: "关注" },
  "card.repos": { en: "repos", zh: "仓库" },
  "card.rank": { en: "Rank #{n}", zh: "第 {n} 名" },
  "card.joined": { en: "Joined {year}", zh: "{year} 年加入" },

  "action.more": { en: "Show {n} more", zh: "再显示 {n} 条" },
  "badge.new": { en: "new", zh: "新" },
  "filter.clear": { en: "All", zh: "全部" },

  "theme.system": { en: "Auto", zh: "跟随系统" },
  "theme.light": { en: "Light", zh: "浅色" },
  "theme.dark": { en: "Dark", zh: "深色" },
  "theme.hint": { en: "Switch theme", zh: "切换主题" },

  "footer.by": { en: "Built by", zh: "作者" },
  "footer.source": { en: "Source on GitHub", zh: "源码" },
} satisfies Record<string, Record<Lang, string>>;

export type Key = keyof typeof dict;

export function t(key: Key, lang: Lang, values?: Record<string, string | number>): string {
  let text: string = dict[key][lang];
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function num(n: number): string {
  return n.toLocaleString("en-US");
}
