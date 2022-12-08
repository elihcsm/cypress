const createPullRequest = async ({ context, github, baseBranch, branchName, description, body, reviewers }) => {
  const { number } = await github.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: baseBranch,
    head: branchName,
    title: `chore: ${description}`,
    body,
    maintainer_can_modify: true,
  })

  if (reviewers) {
    await github.pulls.createReviewRequest({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: number,
      reviewers,
    })
  }
}

module.exports = {
  createPullRequest,
}
