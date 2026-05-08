(function bootstrapGitHubHelpers() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});
  const constants = app.constants;

  function parseRepositoryName() {
    const meta = document.querySelector(constants.selectors.repositoryNameMeta);

    if (meta && meta.content && meta.content.includes("/")) {
      const [owner, repo] = meta.content.split("/");
      return { owner, repo };
    }

    const segments = window.location.pathname.split("/").filter(Boolean);

    if (segments.length >= 2) {
      return {
        owner: segments[0],
        repo: segments[1]
      };
    }

    return null;
  }

  function parseBranchName() {
    const repository = parseRepositoryName();
    const feedLink = document.querySelector(constants.selectors.branchFeedLink);

    if (!repository || !feedLink) {
      return "";
    }

    const decodedPath = decodeURIComponent(new URL(feedLink.href).pathname);
    const prefix = `/${repository.owner}/${repository.repo}/commits/`;

    if (!decodedPath.startsWith(prefix) || !decodedPath.endsWith(".atom")) {
      return "";
    }

    return decodedPath.slice(prefix.length, -".atom".length);
  }

  function parseCurrentDirectoryPath(repository, branch) {
    if (!repository || !branch) {
      return "";
    }

    const decodedPath = decodeURIComponent(window.location.pathname);
    const basePrefix = `/${repository.owner}/${repository.repo}`;

    if (!decodedPath.startsWith(basePrefix)) {
      return "";
    }

    const treePrefix = `${basePrefix}/tree/${branch}`;

    if (decodedPath === treePrefix) {
      return "";
    }

    if (decodedPath.startsWith(`${treePrefix}/`)) {
      return decodedPath.slice(treePrefix.length + 1);
    }

    return "";
  }

  function isSupportedRepositoryPage() {
    const repository = parseRepositoryName();
    const main = document.querySelector(constants.selectors.rootMain);

    if (!repository || !main) {
      return false;
    }

    const path = decodeURIComponent(window.location.pathname);
    const repositoryRoot = `/${repository.owner}/${repository.repo}`;

    if (path === repositoryRoot || path === `${repositoryRoot}/`) {
      return true;
    }

    return (
      path.startsWith(`${repositoryRoot}/tree/`) ||
      path.startsWith(`${repositoryRoot}/blob/`)
    );
  }

  function getRepositoryContext() {
    const repository = parseRepositoryName();
    const branch = parseBranchName();
    const currentDirectoryPath = parseCurrentDirectoryPath(repository, branch);

    if (!repository) {
      return null;
    }

    return {
      owner: repository.owner,
      repo: repository.repo,
      branch,
      currentDirectoryPath
    };
  }

  function parseItemFromHref(href, context) {
    if (!href || !context) {
      return null;
    }

    const decodedPath = decodeURIComponent(new URL(href).pathname);
    const blobPrefix = `/${context.owner}/${context.repo}/blob/`;
    const treePrefix = `/${context.owner}/${context.repo}/tree/`;
    const isBlob = decodedPath.startsWith(blobPrefix);
    const isTree = decodedPath.startsWith(treePrefix);

    if (!isBlob && !isTree) {
      return null;
    }

    const prefix = isBlob ? blobPrefix : treePrefix;
    const remainder = decodedPath.slice(prefix.length);
    const branchPrefix = context.branch ? `${context.branch}/` : "";
    let relativePath = remainder;

    if (context.branch && remainder === context.branch) {
      relativePath = "";
    } else if (branchPrefix && remainder.startsWith(branchPrefix)) {
      relativePath = remainder.slice(branchPrefix.length);
    }

    if (!relativePath) {
      return null;
    }

    return {
      path: relativePath,
      kind: isBlob ? "file" : "directory"
    };
  }

  function getCandidateRows(link) {
    return constants.selectors.rowContainers
      .map((selector) => link.closest(selector))
      .filter(Boolean);
  }

  function getPrimaryRowCandidate(link) {
    const candidates = getCandidateRows(link);

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((left, right) => {
      return left.querySelectorAll("a").length - right.querySelectorAll("a").length;
    })[0];
  }

  function getFallbackContainer(link) {
    return (
      link.closest("td") ||
      link.closest('[role="gridcell"]') ||
      link.parentElement ||
      null
    );
  }

  function getMountTarget(row, link) {
    if (!row) {
      return link.parentElement || null;
    }

    if (row.tagName === "TR") {
      const cells = Array.from(row.querySelectorAll(":scope > td"));
      if (cells[1]) {
        return cells[1];
      }
    }

    const cell =
      link.closest("td") ||
      link.closest('[role="gridcell"]') ||
      row.querySelector("td") ||
      row.querySelector('[role="gridcell"]');

    if (cell) {
      return cell;
    }

    return link.parentElement || row;
  }

  function findRepositoryItems(context) {
    if (!context) {
      return [];
    }

    const prefix = `/${context.owner}/${context.repo}/`;
    const rows = new Map();

    document.querySelectorAll(constants.selectors.fileLinks).forEach((link) => {
      const href = link.getAttribute("href");

      if (!href || !href.startsWith(prefix)) {
        return;
      }

      const row = getPrimaryRowCandidate(link) || getFallbackContainer(link);
      const parsed = parseItemFromHref(link.href, context);

      if (!row || !parsed) {
        return;
      }

      if (row.closest("#readme")) {
        return;
      }

      const existing = rows.get(row);
      const item = {
        element: row,
        link,
        mountTarget: getMountTarget(row, link),
        href: link.href,
        name: link.textContent.trim() || parsed.path.split("/").pop() || "",
        path: parsed.path,
        kind: parsed.kind
      };

      if (!existing || item.path.length < existing.path.length) {
        rows.set(row, item);
      }
    });

    return Array.from(rows.values()).sort((left, right) => {
      return left.path.localeCompare(right.path);
    });
  }

  app.github = {
    getRepositoryContext,
    isSupportedRepositoryPage,
    findRepositoryItems
  };
})();
