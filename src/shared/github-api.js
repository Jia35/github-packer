(function bootstrapGitHubApi() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});
  const treeCache = new Map();

  function createApiUrl(path) {
    return `https://api.github.com${path}`;
  }

  function encodePathSegments(path) {
    return path
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  async function createHeaders(accept) {
    const token = await app.auth.getToken();
    const headers = {};

    if (accept) {
      headers.Accept = accept;
    }

    if (token) {
      headers.Authorization = `token ${token}`;
    }

    return headers;
  }

  async function fetchJson(url, options = {}) {
    const headers = await createHeaders("application/vnd.github+json");
    const response = await fetch(url, {
      headers,
      credentials: "omit",
      signal: options.signal
    });

    if (!response.ok) {
      let detail = "";

      try {
        const payload = await response.json();
        detail = payload && payload.message ? ` (${payload.message})` : "";
      } catch (error) {
        detail = "";
      }

      const fetchError = new Error(app.i18n.t("messages.apiFailed", { status: response.status, detail }));
      fetchError.status = response.status;
      throw fetchError;
    }

    return response.json();
  }

  async function resolveBranch(context, options = {}) {
    if (context.branch) {
      return context.branch;
    }

    const repo = await fetchJson(
      createApiUrl(`/repos/${context.owner}/${context.repo}`),
      { signal: options.signal }
    );
    return repo.default_branch || "";
  }

  async function fetchRepositoryTree(context, branch, options = {}) {
    const cacheKey = `${context.owner}/${context.repo}:${branch}`;
    if (treeCache.has(cacheKey)) {
      console.log(`[GitHub Packer] Using cached tree for ${cacheKey}`);
      return treeCache.get(cacheKey);
    }

    const encodedRef = encodeURIComponent(branch);
    const tree = await fetchJson(
      createApiUrl(`/repos/${context.owner}/${context.repo}/git/trees/${encodedRef}?recursive=1`),
      { signal: options.signal }
    );

    if (!Array.isArray(tree.tree)) {
      throw new Error(app.i18n.t("messages.noTree"));
    }

    const result = {
      truncated: Boolean(tree.truncated),
      files: tree.tree.filter((entry) => entry && entry.type === "blob" && entry.path)
    };

    treeCache.set(cacheKey, result);
    return result;
  }

  async function fetchFileContent(context, branch, path, options = {}) {
    const token = await app.auth.getToken();
    let url = "";
    let headers = {};

    if (token) {
      url = createApiUrl(
        `/repos/${context.owner}/${context.repo}/contents/${encodePathSegments(path)}?ref=${encodeURIComponent(branch)}`
      );
      headers = await createHeaders("application/vnd.github.v3.raw");
    } else {
      url = `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${encodeURIComponent(branch)}/${encodePathSegments(path)}`;
    }

    const response = await fetch(url, {
      headers,
      credentials: "omit",
      signal: options.signal
    });

    if (!response.ok) {
      const fetchError = new Error(`${app.i18n.t("ui.failedDownload")} ${path}`);
      fetchError.status = response.status;
      throw fetchError;
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  app.githubApi = {
    resolveBranch,
    fetchRepositoryTree,
    fetchFileContent
  };
})();
