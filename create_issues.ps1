# CashPilot — Create 10 startup milestone GitHub issues
# Usage: .\create_issues.ps1 -Token "ghp_yourtoken"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$repo  = "avase33/cashpilot"
$base  = "https://api.github.com/repos/$repo/issues"
$heads = @{
    Authorization = "Bearer $Token"
    Accept        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$issues = @(
    @{
        title = "Milestone 1: Stripe payment integration for invoice collection"
        body  = "Integrate Stripe to allow clients to pay invoices online directly from a hosted payment page. Implement webhook handling for payment confirmation and automatic invoice status updates to 'paid'. Support partial payments. Acceptance: invoice payment link works end-to-end with real Stripe test keys."
        labels = @("enhancement","milestone")
    },
    @{
        title = "Milestone 2: Bank account sync via Plaid API"
        body  = "Connect bank accounts through Plaid Link to automatically import real transactions. Map Plaid categories to CashPilot categories. Handle sync conflicts and duplicate detection. Store Plaid access tokens encrypted at rest. Acceptance: user can link a Chase/BoA account and see transactions auto-populate."
        labels = @("enhancement","milestone")
    },
    @{
        title = "Milestone 3: AI-powered categorization with OpenAI"
        body  = "Use OpenAI GPT-4o to auto-categorize imported transactions based on description, merchant, and amount. Add a 'suggestion confidence' field and a one-click accept/override UI. Batch classify on first sync. Acceptance: 85%+ accuracy on common startup expense patterns."
        labels = @("enhancement","milestone","ai")
    },
    @{
        title = "Milestone 4: PDF invoice generation and email delivery"
        body  = "Generate professional PDF invoices using Puppeteer or pdfkit with CashPilot branding, organization logo, and line items. Send invoices directly via SendGrid email with a tracked 'View Invoice' link that updates status to 'viewed'. Acceptance: invoice PDF renders correctly and email delivered reliably."
        labels = @("enhancement","milestone")
    },
    @{
        title = "Milestone 5: Multi-currency support with live FX rates"
        body  = "Support transactions and invoices in non-USD currencies. Fetch live exchange rates from ExchangeRate-API or Open Exchange Rates. Convert all amounts to the org's base currency for reporting and forecasting. Acceptance: a EUR invoice displays correct USD equivalent on the dashboard."
        labels = @("enhancement","milestone")
    },
    @{
        title = "Milestone 6: Budget vs actuals tracking per category"
        body  = "Allow owners to set monthly budgets per expense category. Show budget utilization on the Dashboard and Reports page as progress bars with RAG status. Fire an alert when any category exceeds 80% of budget. Acceptance: payroll budget of \$10k shows 72% utilized with correct calculation."
        labels = @("enhancement","milestone")
    },
    @{
        title = "Milestone 7: Mobile-responsive PWA with offline support"
        body  = "Make the frontend a Progressive Web App installable on iOS and Android. Add a service worker for offline caching of the dashboard and accounts pages. Implement a sync queue for offline transaction entry. Acceptance: app installs from Chrome on Android and loads dashboard without network."
        labels = @("enhancement","milestone")
    },
    @{
        title = "Milestone 8: Audit log for all financial mutations"
        body  = "Record an immutable audit trail for every create/update/delete on Transactions, Invoices, Bills, and Accounts. Store actor, timestamp, diff (before/after), and IP. Add an Audit Log page accessible only to owners. Acceptance: deleting a transaction shows the actor and original amount in the log."
        labels = @("enhancement","milestone","security")
    },
    @{
        title = "Milestone 9: QuickBooks / Xero export integration"
        body  = "Export transactions and invoices in QuickBooks IIF format and Xero CSV format. Add an Integrations settings page with date range selection and account mapping. Acceptance: exported QuickBooks file imports cleanly into a QuickBooks Online sandbox without errors."
        labels = @("enhancement","milestone")
    },
    @{
        title = "Milestone 10: Custom report builder with CSV/Excel export"
        body  = "Build a drag-and-drop report builder where users select dimensions (account, category, month, type) and metrics (sum, count, avg). Allow saving custom report templates. Export results to CSV and XLSX. Acceptance: custom P&L report by month exports correctly with totals row in Excel."
        labels = @("enhancement","milestone")
    }
)

Write-Host "Creating $($issues.Length) issues on $repo..." -ForegroundColor Cyan

foreach ($issue in $issues) {
    $body = @{
        title  = $issue.title
        body   = $issue.body
        labels = $issue.labels
    } | ConvertTo-Json -Compress

    try {
        $resp = Invoke-RestMethod -Uri $base -Method Post -Headers $heads -Body $body -ContentType "application/json"
        Write-Host "  [OK] #$($resp.number) $($resp.title)" -ForegroundColor Green
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "  [FAIL] $($issue.title): $_" -ForegroundColor Red
    }
}

Write-Host "`nDone." -ForegroundColor Cyan
