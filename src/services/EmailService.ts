// src/services/EmailService.ts
import "dotenv/config";
import nodemailer from "nodemailer";
import {
  Department,
  Employee,
  Position,
  Workflow,
  WorkflowRequest,
} from "../models";
import { StageUtils } from "../utils/stageUtils";

export interface ResetEmailData {
  user: Employee | null;
  resetLink: string;
  expiryMinutes: number;
  requestDetails: {
    browser?: string;
    os?: string;
    ip: string;
    timestamp: Date;
  };
}
export interface PasswordChangedEmailData {
  user?: Employee;
  changeDetails: { timestamp: Date; ip: string; browser?: string; os?: string };
}

function asBool(v: any, def = false) {
  if (v == null) return def;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const {
      SMTP_HOST = "mail.eduxora.com", // cPanel default: mail.<domain>
      SMTP_PORT = "465", // 465 implicit TLS (recommended)
      SMTP_SECURE, // 'true' | 'false' | undefined => auto by port
      SMTP_USER,
      SMTP_PASS,
      SMTP_DEBUG,
    } = process.env;

    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error(
        "Missing SMTP_USER/SMTP_PASS. Check your environment (.env, Docker, PM2)."
      );
    }

    const port = Number(SMTP_PORT);
    const secure =
      SMTP_SECURE === "true"
        ? true
        : SMTP_SECURE === "false"
        ? false
        : port === 465; // auto

    this.transporter = nodemailer.createTransport({
      host: "premium196.web-hosting.com",
      port: 465, // or 587
      secure: true, // true for 465, false for 587
      requireTLS: false, // true if port 587
      auth: { user: "sped@eduxora.com", pass: process.env.SMTP_PASS! },
      tls: { minVersion: "TLSv1.2" },
    });

    // Optional: verify once on startup (handy while configuring)
    if (asBool(SMTP_DEBUG)) {
      this.transporter
        .verify()
        .then(() => console.log("[SMTP] Verified as", SMTP_USER))
        .catch((err) =>
          console.error("[SMTP] Verify failed:", err?.message || err)
        );
    }
  }

  async sendResetEmail(data: ResetEmailData): Promise<void> {
    const { user, resetLink, expiryMinutes, requestDetails } = data;

    const orgName = process.env.ORG_NAME || "Your Organization";
    const fromName = process.env.FROM_NAME || orgName;
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER!; // safer default

    const common = {
      firstName: user?.firstName || "there",
      resetLink,
      minutes: expiryMinutes,
      browser: requestDetails.browser || "Unknown browser",
      os: requestDetails.os || "Unknown OS",
      ip: requestDetails.ip,
      when: requestDetails.timestamp.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }),
      orgName,
    };

    await this.transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: user?.email,
      subject: "Reset your password",
      text: this.generateResetEmailText(common),
      html: this.generateResetEmailHTML(common),
    });
  }

  async sendPasswordChangedEmail(
    data: PasswordChangedEmailData
  ): Promise<void> {
    const { user, changeDetails } = data;

    const orgName = process.env.ORG_NAME || "Your Organization";
    const fromName = process.env.FROM_NAME || orgName;
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER!;

    const html = this.generatePasswordChangedHTML({
      firstName: user?.firstName || "there",
      when: changeDetails.timestamp.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }),
      ip: changeDetails.ip,
      browser: changeDetails.browser || "Unknown browser",
      os: changeDetails.os || "Unknown OS",
      orgName,
    });

    await this.transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: user?.email,
      subject: `Your ${orgName} password was changed`,
      html,
    });
  }

  async sendTaskEmail(workflowRequest: WorkflowRequest): Promise<void> {
    // get nextstage
    const nextStage = await StageUtils.getNextStage(workflowRequest?.id);
    const request = await WorkflowRequest.findByPk(workflowRequest?.id, {
      include: [
        Workflow,
        { model: Employee, as: "requestor", include: [Position, Department] },
      ],
    });

    const requestor = request?.requestor;
    const workflow = request?.workflow;

    const orgName = process.env.ORG_NAME || "Your Organization";
    const fromName = process.env.FROM_NAME || orgName;
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER!; // safer default

    if (nextStage) {
      const receiver = nextStage?.assignedTo;
      await this.transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: receiver?.email,
        subject: "New Task",
        text: this.generateNewTaskEmailText(receiver, requestor, workflow),
        html: this.generateNewTaskEmailHTML(receiver, requestor, workflow),
      });
    } else {
      await this.transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: requestor?.email,
        subject: "Task Submission Update",
        text: this.generateTaskSubmissionEmailText(
          request,
          requestor,
          workflow
        ),
        html: this.generateTaskSubmissionEmailHTML(
          request,
          requestor,
          workflow
        ),
      });
    }
  }

  private generateTaskSubmissionEmailText(
    request: WorkflowRequest | null,
    requestor?: Employee,
    workflow?: Workflow
  ): string {
    return `Hi ${requestor?.firstName},

      Your submission (${workflow?.name}) has been ${request?.status}.

      Link: ${process.env.FRONTEND_URL}

      Request Details:
      - Applicant: ${requestor?.firstName} ${requestor?.lastName}
      - Department: ${requestor?.department?.name}
      - Position: ${requestor?.position.title}

`;
  }

  private generateTaskSubmissionEmailHTML(
    request: WorkflowRequest | null,
    requestor?: Employee,
    workflow?: Workflow
  ): string {
    return `<!DOCTYPE html><html><body>
      <h1>Request update</h1>
      <p>Hi ${requestor?.firstName},</p>
      <p>Your submission (${workflow?.name}) has been ${request?.status}.</p>
      <p><a href="${process.env.FRONTEND_URL}">Link</a></p>
      <h3>Request Details</h3>
      <ul>
        <li>Applicant: ${requestor?.firstName} ${requestor?.lastName}</li>
        <li>Department: ${requestor?.department?.name}</li>
        <li>Position: ${requestor?.position.title}</li>
      </ul>
    </body></html>`;
  }

  private generateNewTaskEmailText(
    receiver?: Employee,
    requestor?: Employee,
    workflow?: Workflow
  ): string {
    return `Hi ${receiver?.firstName},

      There is a new task (${workflow?.name}) that require your review.

      Link: ${process.env.FRONTEND_URL}

      Request Details:
      - Applicant: ${requestor?.firstName} ${requestor?.lastName}
      - Department: ${requestor?.department?.name}
      - Position: ${requestor?.position.title}

`;
  }

  private generateNewTaskEmailHTML(
    receiver?: Employee,
    requestor?: Employee,
    workflow?: Workflow
  ): string {
    return `<!DOCTYPE html><html><body>
      <h1>New Task</h1>
      <p>Hi ${receiver?.firstName},</p>
      <p>There is a new task (${workflow?.name}) that require your review.</p>
      <p><a href="${process.env.FRONTEND_URL}">Link</a></p>
      <h3>Request Details</h3>
      <ul>
        <li>Applicant: ${requestor?.firstName} ${requestor?.lastName}</li>
        <li>Department: ${requestor?.department?.name}</li>
        <li>Position: ${requestor?.position.title}</li>
      </ul>
    </body></html>`;
  }

  // --- keep your existing templates; placeholders shown for brevity ---
  private generateResetEmailHTML(d: {
    firstName: string;
    resetLink: string;
    minutes: number;
    browser: string;
    os: string;
    ip: string;
    when: string;
    orgName: string;
  }): string {
    return `<!DOCTYPE html><html><body>
      <h1>Reset your password</h1>
      <p>Hi ${d.firstName},</p>
      <p>We received a request to reset your ${d.orgName} password.</p>
      <p><a href="${d.resetLink}">Reset Password</a> (expires in ${d.minutes} minutes)</p>
      <h3>Request Details</h3>
      <ul>
        <li>Time: ${d.when}</li><li>Browser: ${d.browser}</li>
        <li>OS: ${d.os}</li><li>IP: ${d.ip}</li>
      </ul>
      <p>If you didn’t request this, please ignore this email.</p>
    </body></html>`;
  }

  private generateResetEmailText(d: {
    firstName: string;
    resetLink: string;
    minutes: number;
    browser: string;
    os: string;
    ip: string;
    when: string;
    orgName: string;
  }): string {
    return `Hi ${d.firstName},

We received a request to reset your ${d.orgName} password.

Reset link: ${d.resetLink}
(Expires in ${d.minutes} minutes)

Request Details:
- Time: ${d.when}
- Browser: ${d.browser}
- OS: ${d.os}
- IP: ${d.ip}

If you didn’t request this, you can ignore this message.`;
  }

  private generatePasswordChangedHTML(d: {
    firstName: string;
    when: string;
    ip: string;
    browser: string;
    os: string;
    orgName: string;
  }): string {
    return `<!DOCTYPE html><html><body>
      <h1>✓ Password Changed</h1>
      <p>Hi ${d.firstName},</p>
      <p>Your ${d.orgName} password was changed.</p>
      <ul>
        <li>Time: ${d.when}</li><li>Browser: ${d.browser}</li>
        <li>OS: ${d.os}</li><li>IP: ${d.ip}</li>
      </ul>
      <p>If this wasn’t you, contact support immediately.</p>
    </body></html>`;
  }
}
