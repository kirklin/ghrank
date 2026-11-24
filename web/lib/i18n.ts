export type Lang = "en" | "zh";

export const LANGS: Lang[] = ["en", "zh"];

const dict = {
  "nav.users": { en: "Developers", zh: "用户" },
  "nav.repos": { en: "Repositories", zh: "仓库" },
  "nav.regions": { en: "Regions", zh: "地区" },
  "nav.languages": { en: "Languages", zh: "语言" },
  "nav.stars": { en: "Star History", zh: "Star 历史" },

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

  "stars.title": { en: "GitHub Star History", zh: "GitHub Star 历史" },
  "stars.add": { en: "Add a repository, e.g. vuejs/core", zh: "添加仓库，例如 vuejs/core" },
  "stars.empty": { en: "Add a repository to see how its stars grew.", zh: "添加仓库后，可以查看它的 Star 增长曲线。" },
  "stars.invalid": { en: "Enter a repository as owner/name.", zh: "请输入 owner/name 格式的仓库名。" },
  "stars.limit": { en: "You can add up to {n} repositories.", zh: "最多只能添加{n}个仓库" },
  "stars.loading": { en: "Loading", zh: "正在获取" },
  "stars.notFound": { en: "Couldn't find \"{repo}\". Check the repository name.", zh: "无法找到\"{repo}\"，请检查仓库名是否正确。" },
  "stars.failed": { en: "Couldn't load \"{repo}\". Try again later.", zh: "未能获取\"{repo}\"的数据，请稍后再试。" },
  "stars.rateLimited": {
    en: "GitHub's request limit has been reached. Add an access token to continue.",
    zh: "GitHub 的请求次数已达上限，暂无法获取数据，需填入访问令牌。",
  },
  "stars.unauthorized": { en: "The access token is invalid. Enter it again.", zh: "访问令牌无效，请重新填写。" },
  "stars.token": { en: "Access token", zh: "访问令牌" },
  "stars.tokenPlaceholder": { en: "Paste a GitHub access token", zh: "粘贴 GitHub 访问令牌" },
  "stars.tokenHint": {
    en: "The token needs no scopes and is stored only in this browser.",
    zh: "令牌不需要勾选任何权限，只保存在这个浏览器里。",
  },
  "stars.modeDate": { en: "Date", zh: "日期" },
  "stars.modeTimeline": { en: "Timeline", zh: "起点对齐" },
  "stars.linear": { en: "Linear", zh: "线性" },
  "stars.log": { en: "Log", zh: "对数" },
  "stars.day": { en: "Day {n}", zh: "第{n}天" },

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
  "action.add": { en: "Add", zh: "添加" },
  "action.save": { en: "Save", zh: "保存" },
  "action.remove": { en: "Remove", zh: "移除" },
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
