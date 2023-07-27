import Express, { CookieOptions } from 'express'
import { inject, injectable } from 'inversify'
import { SGID_LOGIN_OAUTH_STATE, SgidAuthService } from '../../services/sgid'
import { UserRepositoryInterface } from '../../repositories/interfaces/UserRepositoryInterface'
import { DependencyIds } from '../../constants'
import { validEmailDomainGlobExpression } from '../../config'

export const OFFICER_EMAIL_SCOPE = 'ogpofficerinfo.work_email'
const SGID_STATE_COOKIE_NAME = 'gogovsg_sgid_state'
const SgidStateCookieConfig: CookieOptions = {
  httpOnly: true,
}

@injectable()
export class SgidLoginController {
  private sgidService

  private userRepository: UserRepositoryInterface

  constructor(
    @inject(DependencyIds.userRepository)
    userRepository: UserRepositoryInterface,
  ) {
    this.sgidService = SgidAuthService
    this.userRepository = userRepository
  }

  public generateAuthUrl: (
    req: Express.Request,
    res: Express.Response,
  ) => void = (_req, res) => {
    const { url, codeVerifier, nonce } = this.sgidService.authorizationUrl()

    res.cookie(
      SGID_STATE_COOKIE_NAME,
      { codeVerifier, nonce },
      SgidStateCookieConfig,
    )
    res.send(url)
    return
  }

  public handleLogin = async (req: Express.Request, res: Express.Response) => {
    try {
      const { code, state } = req.query
      const sessionData = req.cookies[SGID_STATE_COOKIE_NAME]

      if (state !== SGID_LOGIN_OAUTH_STATE) {
        throw new Error('Error logging in with SGID: state is incorrect')
      }

      const { sub, accessToken } = await this.sgidService.callback(
        String(code),
        String(sessionData.nonce),
        String(sessionData.codeVerifier),
      )

      const { data } = await this.sgidService.userinfo(accessToken, sub)
      const officerEmail = data[OFFICER_EMAIL_SCOPE]

      if (
        !officerEmail ||
        !officerEmail.length ||
        !officerEmail.match(
          new RegExp(validEmailDomainGlobExpression.substring(1)),
        )
      ) {
        // redirect back to sgid login page, if authentication fails,
        // or officer email is not valid
        res.redirect(`/#/ogp-login?statusCode=403&officerEmail=${officerEmail}`)
        return
      }

      const dbUser = await this.userRepository.findOrCreateWithEmail(
        data[OFFICER_EMAIL_SCOPE],
      )

      req.session!.user = dbUser

      res.redirect(`/#/user`)
      return
    } catch (error) {
      console.error(error)
      res.status(500).render('error', { error })
    }
  }
}

export default SgidLoginController
