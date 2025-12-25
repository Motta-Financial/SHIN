"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Shield,
  Handshake,
  AlertTriangle,
  Send,
} from "lucide-react"

type AgreementType = "client-contract" | "student-confidentiality" | "director-confidentiality"

interface OnboardingAgreementsProps {
  userType: "student" | "client" | "director"
  userName: string
  userEmail: string
  programName?: string
  clientName?: string
  onAgreementSigned?: (type: AgreementType) => void
  signedAgreements?: AgreementType[]
}

// Client Engagement Agreement Content
const CLIENT_ENGAGEMENT_AGREEMENT = {
  title: "SEED Program Engagement Agreement",
  sections: [
    {
      title: "Recitals",
      content: `WHEREAS, Suffolk University is a non-profit educational institution located in Boston, Massachusetts that is committed to educating students to become lifelong learners and professionals who lead and serve the communities in which they live and work.

WHEREAS, Client is a business that will receive technical assistance support and/or consulting services.

WHEREAS, Client seeks to participate in the SEED Program services described in Schedule A (the "SEED Project" or "Clinical Project").`,
    },
    {
      title: "1. Fee for Services",
      content: 'The fee is provided in Appendix 1 (the "SEED Project" or "Clinical Project").',
    },
    {
      title: "2. Scope of Services",
      content:
        "Client understands that SEED program's services are initially limited to those specified in the SEED Project. The scope may be modified by mutual agreement during the engagement.",
    },
    {
      title: "3. Nature of Engagement",
      content:
        "Client understands that the SEED Project will be primarily handled by students under the supervision of faculty or employ of Suffolk University. Client also understands that several students, support staff members and volunteers may be involved in SEED project.",
    },
    {
      title: "4. Client Responsibilities",
      content: `Client agrees to cooperate with SEED in the handling of Client's matter. This includes:
• Keeping SEED informed of Client's current mailing address, email address and telephone number
• Responding to SEED correspondence in a timely manner
• Providing SEED with the information necessary for SEED to adequately complete the SEED Project
• Permission as required to access information systems (including accounting, CRM, and web site)
• Coming to scheduled meetings (in-person or virtually)
• Performing any other duties necessary to completing the SEED project`,
    },
    {
      title: "5. Outcome Disclaimer",
      content:
        "SEED Program makes no guarantee regarding the outcome or success of Client's business. SEED Program does not have or hold any power to guarantee any certain outcome in favor of Client. Client understands that SEED makes no guarantees that this service will achieve any particular objective or outcome. Recommendations are provided in the form of advice. Following the SEED's recommendations is at Client's sole risk and the University cannot be held liable for any actions client chooses to take based on that advice.",
    },
    {
      title: "6. Project Results and Intellectual Property",
      content: `A. Project Results means all data, inventions, discoveries, copyrighted works, software, code, and tangible materials that are conceived, created, and/or first reduced to practice during the performance of this Clinical Project.

B. Inventor and Author Status: A person's status as an inventor or author will be determined in accordance with U.S. laws.

C. Ownership: Client owns all rights, title and interests in any Project Results created solely by client's employees in performance of the SEED Project ("Client Project Results"). If the Client provides guidance, direct input, or information that is utilized in the development of the SEED Project Results, Client shall qualify as a joint inventor or co-author of any SEED Project Results with SU employees and/or students.

D. SU and students jointly own Project Results created jointly by SU employees and students in performance of the SEED Project ("SU-Student Project Results").`,
    },
    {
      title: "7. Confidential Information and Publications",
      content: `A. All information that Client considers proprietary or confidential, if in writing or other tangible form, shall be conspicuously labeled or marked as "confidential" and if oral shall be identified as "confidential" at the time of disclosure and promptly confirmed in writing.

B. Confidential Information means any information disclosed by one party to the other party that is not generally known to the public and relates to scientific knowledge, know-how, processes, inventions, techniques, formulae, products, data, plans, software, business strategies, or similar information. The confidentiality obligations herein continue for three (3) years from disclosure or until the Confidential Information becomes publicly available through no fault of the Recipient, whichever occurs first.

C. SEED faculty and students will sign the attached SEED Project Participation Confidentiality Agreement to participate in the SEED Clinical Project.

D. Legally Protected Information: Clients shall not disclose information to SU faculty or students that is protected by statute including but not limited to information subject to US export control laws, protected health information, Controlled Unclassified Information of the US Government, or any other information that could expose SU faculty or students to civil or criminal liability if inadvertently disclosed.`,
    },
    {
      title: "8. Liability and Disclaimer of Warranties",
      content: `A. SU Liability: In no event shall the University or its employees have any liability to the client for any direct, indirect, special or consequential damages whatsoever however caused and under any theory of liability arising out of, resulting from or in any way related to this Agreement.

B. Limitation of Liability: In no event will the Parties, or their officers, agents, or employees be liable for any incidental, special, punitive, direct, indirect, exemplary or consequential damages of any kind.

C. No Student, Faculty, Administrators and Employees Liability: With the exception of cases of willful misconduct, Client agrees not to hold students, faculty, administrators, and employees liable for any liability arising out of or related to their performance of the Clinical Project.

D. DISCLAIMER OF WARRANTIES: Any Project Results provided to Client are provided "as is." SU and its employees, officers, and agents disclaim any and all representations or warranties, express or implied.`,
    },
    {
      title: "9. Client Withdrawal",
      content:
        "Client may withdraw consent to Consultation by SEED and may terminate the services of SEED at any time. Client understands that if Client wishes to terminate SEED's Consultation, Client should notify the director of SEED in writing.",
    },
    {
      title: "10. Clinic Withdrawal",
      content:
        "SEED may withdraw from representing Client if Client's matter becomes unsuitable for SEED's services, Client fails to respond to information requests from SEED, or is not responsive or fails to communicate with SEED within a reasonable amount of time, never to exceed two weeks (14 calendar days), and if Client fails to adhere to the client responsibilities outlined in Paragraph 4.",
    },
    {
      title: "11. Semester Operations",
      content:
        "Client understands that the Clinic generally operates on a semester-by-semester basis. Client understands that if the services requested are not completed by the time the students complete a semester, the Clinic may transfer the matter to another student associated with the Clinic to begin work during a subsequent semester. Client further understands that some delay in Consultation or of the Service requested may occur during the summer months.",
    },
    {
      title: "12. General Provisions",
      content: `A. Relationship of Parties: For the purposes of this Agreement and all work performed hereunder, the parties are and shall be deemed to be independent contractors and not agents or employees of the other party. Students are not parties to this Agreement.

B. Severability: If any provision is held to be invalid, illegal, or unenforceable, such invalidity shall not affect any other provision hereof.

C. Governing Law: The laws of the Commonwealth of Massachusetts shall govern this Agreement.

D. Entire Agreement: This Agreement constitutes the entire understanding by and between the parties with respect to the Clinical Project. All prior agreements are superseded by this Agreement.`,
    },
  ],
}

// Student Confidentiality Agreement Content
const STUDENT_CONFIDENTIALITY_AGREEMENT = {
  title: "SEED Project Participation Confidentiality Agreement",
  description:
    "Due to your access to confidential information, all students participating in SEED programs must sign this agreement.",
  sections: [
    {
      title: "Definition of Confidential Information",
      content: `"Confidential information" means any information of a secret or confidential nature relating to the workplace. All such information should be labeled or marked as "confidential" by the client.

Confidential information may include, but is not limited to, the following:
• Trade secrets and proprietary information
• Customer information and customer lists
• Methods, plans, documents, data, drawings
• Manuals, notebooks, reports, models
• Inventions, formulas, processes, software
• Information systems, contracts, negotiations
• Strategic planning, proposals, business alliances
• Training materials`,
    },
    {
      title: "Your Agreement",
      content: `In connection with your participation in this SEED program, you agree to the following:

1. You have read and understand the above definition of "confidential information."

2. You agree that you will not at any time, both during and after your enrollment in SEED, communicate or disclose confidential information to any person, corporation, or entity.

3. You recognize and agree that while in SEED you may become aware of nonpublic information of a personal nature about employees or associates, including, without limitation:
   • Actions, omissions, statements
   • Personally identifiable medical, family, financial, social, behavioral, or other personal or private information

4. You will not disclose any such information that you learn in SEED to any other person or entity, unless required by applicable law or legal process.`,
    },
  ],
}

// Director/Faculty Confidentiality Agreement Content
const DIRECTOR_CONFIDENTIALITY_AGREEMENT = {
  title: "SEED Project Participation Confidentiality Agreement - Faculty/Director",
  description:
    "Due to your access to confidential information, all faculty and directors participating in SEED programs must sign this agreement.",
  sections: [
    {
      title: "Definition of Confidential Information",
      content: `"Confidential information" means any information of a secret or confidential nature relating to the workplace. All such information should be labeled or marked as "confidential" by the client.

Confidential information may include, but is not limited to, the following:
• Trade secrets and proprietary information
• Customer information and customer lists
• Methods, plans, documents, data, drawings
• Manuals, notebooks, reports, models
• Inventions, formulas, processes, software
• Information systems, contracts, negotiations
• Strategic planning, proposals, business alliances
• Training materials`,
    },
    {
      title: "Your Agreement",
      content: `In connection with your participation in this SEED program, you agree to the following:

1. You have read and understand the above definition of "confidential information."

2. You agree that you will not at any time, both during and after your participation in SEED, communicate or disclose confidential information to any person, corporation, or entity.

3. You recognize and agree that while supervising SEED projects you may become aware of nonpublic information of a personal nature about employees, students, clients, or associates, including, without limitation:
   • Actions, omissions, statements
   • Personally identifiable medical, family, financial, social, behavioral, or other personal or private information

4. You will not disclose any such information that you learn in SEED to any other person or entity, unless required by applicable law or legal process.

5. You agree to ensure that students under your supervision understand and comply with confidentiality requirements.`,
    },
  ],
}

export function OnboardingAgreements({
  userType,
  userName,
  userEmail,
  programName = "SEED Program",
  clientName,
  onAgreementSigned,
  signedAgreements = [],
}: OnboardingAgreementsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [agreementToSign, setAgreementToSign] = useState<AgreementType | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [signature, setSignature] = useState("")
  const [signing, setSigning] = useState(false)

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getAgreementsForUserType = () => {
    switch (userType) {
      case "student":
        return [
          {
            type: "student-confidentiality" as AgreementType,
            icon: Shield,
            title: "Student Confidentiality Agreement",
            description: "Required agreement to protect client confidential information",
            agreement: STUDENT_CONFIDENTIALITY_AGREEMENT,
            required: true,
          },
        ]
      case "client":
        return [
          {
            type: "client-contract" as AgreementType,
            icon: Handshake,
            title: "SEED Engagement Agreement",
            description: "Contract between your organization and Suffolk University SEED Program",
            agreement: CLIENT_ENGAGEMENT_AGREEMENT,
            required: true,
          },
        ]
      case "director":
        return [
          {
            type: "director-confidentiality" as AgreementType,
            icon: Shield,
            title: "Faculty/Director Confidentiality Agreement",
            description: "Required agreement for faculty and directors supervising SEED projects",
            agreement: DIRECTOR_CONFIDENTIALITY_AGREEMENT,
            required: true,
          },
        ]
      default:
        return []
    }
  }

  const handleSign = async () => {
    if (!agreementToSign || !signature.trim()) return

    setSigning(true)
    try {
      // Save to database
      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreementType: agreementToSign,
          userName,
          userEmail,
          userType,
          signature: signature.trim(),
          signedAt: new Date().toISOString(),
          programName,
          clientName,
        }),
      })

      if (response.ok) {
        onAgreementSigned?.(agreementToSign)
        setAgreementToSign(null)
        setAcknowledged(false)
        setSignature("")
      }
    } catch (error) {
      console.error("Error signing agreement:", error)
    } finally {
      setSigning(false)
    }
  }

  const agreements = getAgreementsForUserType()
  const allSigned = agreements.every((a) => signedAgreements.includes(a.type))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Onboarding & Administrative Tasks
            </CardTitle>
            <CardDescription>
              Complete the following required agreements to participate in the {programName}
            </CardDescription>
          </div>
          {allSigned ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All Complete
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Clock className="h-3 w-3 mr-1" />
              Action Required
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {agreements.map((item) => {
          const isSigned = signedAgreements.includes(item.type)
          const Icon = item.icon

          return (
            <div
              key={item.type}
              className={`border rounded-lg p-4 ${isSigned ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSigned ? "bg-green-100" : "bg-amber-100"}`}>
                    <Icon className={`h-5 w-5 ${isSigned ? "text-green-600" : "text-amber-600"}`} />
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {item.title}
                      {item.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSigned ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Signed
                    </Badge>
                  ) : (
                    <Dialog
                      open={agreementToSign === item.type}
                      onOpenChange={(open) => {
                        if (!open) {
                          setAgreementToSign(null)
                          setAcknowledged(false)
                          setSignature("")
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setAgreementToSign(item.type)}>
                          Review & Sign
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {item.agreement.title}
                          </DialogTitle>
                          {item.agreement.description && (
                            <DialogDescription>{item.agreement.description}</DialogDescription>
                          )}
                        </DialogHeader>

                        <ScrollArea className="h-[50vh] pr-4">
                          <div className="space-y-4">
                            {item.agreement.sections.map((section, idx) => (
                              <Collapsible
                                key={idx}
                                open={expandedSections[`${item.type}-${idx}`] !== false}
                                onOpenChange={() => toggleSection(`${item.type}-${idx}`)}
                              >
                                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-medium hover:text-primary">
                                  {expandedSections[`${item.type}-${idx}`] === false ? (
                                    <ChevronRight className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  {section.title}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 pl-6">
                                  <div className="text-sm text-muted-foreground whitespace-pre-line bg-muted/50 p-3 rounded-lg">
                                    {section.content}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </div>
                        </ScrollArea>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-amber-800">Please read carefully</p>
                              <p className="text-amber-700">
                                By signing below, you acknowledge that you have read, understood, and agree to the terms
                                outlined in this agreement.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="acknowledge"
                              checked={acknowledged}
                              onCheckedChange={(checked) => setAcknowledged(checked === true)}
                            />
                            <Label htmlFor="acknowledge" className="text-sm">
                              I have read and understand all sections of this agreement
                            </Label>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signature">Electronic Signature (Type your full name)</Label>
                            <Input
                              id="signature"
                              placeholder={userName}
                              value={signature}
                              onChange={(e) => setSignature(e.target.value)}
                              disabled={!acknowledged}
                            />
                            <p className="text-xs text-muted-foreground">
                              Signing as: {userName} ({userEmail})
                            </p>
                          </div>
                        </div>

                        <DialogFooter className="flex gap-2">
                          <Button variant="outline" onClick={() => setAgreementToSign(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSign} disabled={!acknowledged || !signature.trim() || signing}>
                            {signing ? (
                              <>Signing...</>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Sign Agreement
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {userType === "client" && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Appendix Information
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Appendix 1 - SEED Project:</strong> Your Statement of Work (SOW) will be completed with your
              assigned student team and faculty supervisor, detailing the specific project deliverables.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Appendix 2 - Confidentiality:</strong> All participating students and faculty will sign individual
              confidentiality agreements.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
