import chai from 'chai'
import path from 'path'
import snapshot from 'snap-shot-it'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as configUtil from '../src/index'

chai.use(sinonChai)
const { expect } = chai

describe('config/src/index', () => {
  describe('.allowed', () => {
    it('returns filter config only containing allowed keys', () => {
      const keys = configUtil.allowed({
        'baseUrl': 'https://url.com',
        'blacklistHosts': 'breaking option',
        'devServerPublicPathRoute': 'internal key',
        'random': 'not a config option',
      })

      expect(keys).to.deep.eq({
        'baseUrl': 'https://url.com',
        'blacklistHosts': 'breaking option',
      })
    })
  })

  describe('.getBreakingKeys', () => {
    it('returns list of breaking config keys', () => {
      const breakingKeys = configUtil.getBreakingKeys()

      expect(breakingKeys).to.include('blacklistHosts')
      snapshot(breakingKeys)
    })
  })

  describe('.getDefaultValues', () => {
    it('returns list of public config keys', () => {
      const defaultValues = configUtil.getDefaultValues()

      expect(defaultValues).to.deep.include({
        defaultCommandTimeout: 4000,
        scrollBehavior: 'top',
        watchForFileChanges: true,
      })

      expect(defaultValues.env).to.deep.eq({})

      expect(defaultValues.cypressBinaryRoot.split(path.sep).pop()).to.eq('cypress')
      defaultValues.cypressBinaryRoot = '/root/cypress'

      // remove these since they are different depending on your machine
      ;['platform', 'arch', 'version'].forEach((x) => {
        expect(defaultValues[x]).to.exist
        delete defaultValues[x]
      })

      snapshot(defaultValues)
    })

    it('returns list of public config keys for selected testing type', () => {
      const defaultValues = configUtil.getDefaultValues({ testingType: 'e2e' })

      expect(defaultValues).to.deep.include({
        defaultCommandTimeout: 4000,
        scrollBehavior: 'top',
        watchForFileChanges: true,
      })

      expect(defaultValues.env).to.deep.eq({})

      expect(defaultValues.cypressBinaryRoot.split(path.sep).pop()).to.eq('cypress')
      defaultValues.cypressBinaryRoot = '/root/cypress'

      // remove these since they are different depending on your machine
      ;['platform', 'arch', 'version'].forEach((x) => {
        expect(defaultValues[x]).to.exist
        delete defaultValues[x]
      })

      snapshot(defaultValues)
    })
  })

  describe('.getPublicConfigKeys', () => {
    it('returns list of public config keys', () => {
      const publicConfigKeys = configUtil.getPublicConfigKeys()

      expect(publicConfigKeys).to.include('blockHosts')
      expect(publicConfigKeys).to.not.include('devServerPublicPathRoute')
      snapshot(publicConfigKeys)
    })
  })

  describe('.matchesConfigKey', () => {
    it('returns normalized key when config key has a default value', () => {
      let normalizedKey = configUtil.matchesConfigKey('EXEC_TIMEOUT')

      expect(normalizedKey).to.eq('execTimeout')

      normalizedKey = configUtil.matchesConfigKey('Base-url')
      expect(normalizedKey).to.eq('baseUrl')
    })

    it('returns nothing when config key does not has a default value', () => {
      let normalizedKey = configUtil.matchesConfigKey('random')

      expect(normalizedKey).to.be.undefined
    })
  })

  describe('.validate', () => {
    it('validates config', () => {
      const errorFn = sinon.spy()

      configUtil.validate({
        'baseUrl': 'https://',
      }, errorFn)

      expect(errorFn).to.have.callCount(0)
    })

    it('calls error callback if config is invalid', () => {
      const errorFn = sinon.spy()

      configUtil.validate({
        'baseUrl': ' ',
      }, errorFn)

      expect(errorFn).to.have.been.calledWithMatch({ key: 'baseUrl' })
      expect(errorFn).to.have.been.calledWithMatch({ type: 'a fully qualified URL (starting with `http://` or `https://`)' })
    })
  })

  describe('.validateNoBreakingConfig', () => {
    it('calls warning callback if config contains breaking option that warns', () => {
      const warningFn = sinon.spy()
      const errorFn = sinon.spy()

      configUtil.validateNoBreakingConfig({
        'experimentalNetworkStubbing': 'should break',
        configFile: 'config.js',
      }, warningFn, errorFn, 'e2e')

      expect(warningFn).to.have.been.calledOnceWith('EXPERIMENTAL_NETWORK_STUBBING_REMOVED', {
        name: 'experimentalNetworkStubbing',
        newName: undefined,
        value: undefined,
        testingType: 'e2e',
        configFile: 'config.js',
      })

      expect(errorFn).to.have.callCount(0)
    })

    it('calls error callback if config contains breaking option that should throw an error', () => {
      const warningFn = sinon.spy()
      const errorFn = sinon.spy()

      configUtil.validateNoBreakingConfig({
        'blacklistHosts': 'should break',
        configFile: 'config.js',
      }, warningFn, errorFn, 'e2e')

      expect(warningFn).to.have.been.callCount(0)
      expect(errorFn).to.have.been.calledOnceWith('RENAMED_CONFIG_OPTION', {
        name: 'blacklistHosts',
        newName: 'blockHosts',
        value: undefined,
        testingType: 'e2e',
        configFile: 'config.js',
      })
    })
  })

  describe('.validateNoBreakingConfigLaunchpad', () => {
    it('calls warning callback if config contains breaking option that should be shown in launchpad', () => {
      const warningFn = sinon.spy()
      const errorFn = sinon.spy()

      configUtil.validateNoBreakingConfigLaunchpad({
        'experimentalStudio': 'should break',
        configFile: 'config.js',
      }, warningFn, errorFn)

      expect(warningFn).to.have.been.calledOnceWith('EXPERIMENTAL_STUDIO_REMOVED', {
        name: 'experimentalStudio',
        newName: undefined,
        value: undefined,
        testingType: undefined,
        configFile: 'config.js',
      })

      expect(errorFn).to.have.callCount(0)
    })
  })

  describe('.validateNoReadOnlyConfig', () => {
    it('returns an error if validation fails', () => {
      const errorFn = sinon.spy()

      configUtil.validateNoReadOnlyConfig({ chromeWebSecurity: false }, errorFn)

      expect(errorFn).to.have.callCount(1)
      expect(errorFn).to.have.been.calledWithMatch(/chromeWebSecurity/)
    })

    it('does not return an error if validation succeeds', () => {
      const errorFn = sinon.spy()

      configUtil.validateNoReadOnlyConfig({ requestTimeout: 1000 }, errorFn)

      expect(errorFn).to.have.callCount(0)
    })

    it('does not return an error if configuration is a non-Cypress config option', () => {
      const errorFn = sinon.spy()

      configUtil.validateNoReadOnlyConfig({ foo: 'bar' }, errorFn)

      expect(errorFn).to.have.callCount(0)
    })
  })
})
