describe('cloud debug test filtering', () => {
  beforeEach(() => {
    cy.scaffoldProject('cloud-debug-filter')
    cy.openProject('cloud-debug-filter')
    cy.startAppServer('e2e')
  })

  it('works with nested suites', () => {
    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js`)

    cy.waitForSpecToFinish()

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['t2']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t2')

    cy.get('.debug-dismiss').contains('1 / 4 tests').click()
    cy.waitForSpecToFinish({ passCount: 2, failCount: 2 })

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['s1 t4']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t4')
  })

  it('wraps filter UI with large number of tests', () => {
    cy.visitApp(`specs/runner?file=cypress/e2e/lots-of-tests.cy.js`)

    cy.get('[data-cy="reporter-panel"]').as('reporterPanel')

    cy.waitForSpecToFinish()

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['test1']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/lots-of-tests.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 50 })

    cy.get('@reporterPanel').then((el) => el.width(500))
    cy.get('@reporterPanel').percySnapshot('wide')

    cy.get('@reporterPanel').then((el) => el.width(350))
    cy.get('@reporterPanel').percySnapshot('medium')

    cy.get('@reporterPanel').then((el) => el.width(250))
    cy.get('@reporterPanel').percySnapshot('narrow')

    cy.get('@reporterPanel').then((el) => el.width(150))
    cy.get('@reporterPanel').percySnapshot('skinny')
  })

  it('works with skips and onlys', () => {
    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js`)

    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    // .only is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['t1', 't3']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t1')

    cy.get('.debug-dismiss').click().waitForSpecToFinish()

    // .only is ignored as it is not in set of filtered tests
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['t3']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t3')

    cy.get('.debug-dismiss').click().waitForSpecToFinish()

    // .skip is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['t2', 't3']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1, pendingCount: 1 })
    cy.get('.runnable-title').first().contains('t2')
    cy.get('.runnable-title').last().contains('t3')

    cy.get('.debug-dismiss').contains('2 / 4 tests').click().waitForSpecToFinish()

    // suite.only is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['t3', 's1 t4']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })
    cy.get('.runnable-title').contains('t4')
  })

  it('works with browser filter', () => {
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['t1', 's1 t2']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/browsers.cy.js&runId=123`)

    cy.get('.runnable-title').eq(0).contains('t1 (skipped due to browser)')
    cy.get('.runnable-title').eq(1).contains('s1 (skipped due to browser)')
    cy.get('.runnable-title').eq(2).contains('t2')
  })

  it('filter is maintained across cross-domain reinitialization', () => {
    cy.visitApp(`specs/runner?file=cypress/e2e/domain-change.cy.js`)

    cy.get('[data-cy="reporter-panel"]').as('reporterPanel')

    cy.waitForSpecToFinish()

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = ['t2', 't3']
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/domain-change.cy.js&runId=123`)
    cy.waitForSpecToFinish({ failCount: 2 })
  })
})
