export const TITLE = 'turbo-lean × evm.fast: Turbo Benchmark'

export const DIAGRAM = `flowchart TD
    Trigger["workflow_dispatch or push to ci/turbo-* with [turbo-benchmark]<br/>(benchmark.yml untouched · continue-on-error)"] --> Host

    subgraph Runner["Ubuntu 26.04 runner · lean-32vcpu-ubuntu-2604 (no nested QEMU VM)"]
        Host["host.sh start & setup (evm user under /srv)<br/>trusted cache + frozen CAS + spooled nanoda comparator"]
        Preflight["verify.py policy & isolation<br/>freeze_submission · check · sandbox_probe · prepare_project"]

        subgraph Sandbox["Mandatory offline systemd-run + Landlock sandboxes (112 GiB cap)"]
            Audit["1. Trusted axiom audit<br/>lake build TrustedAxioms"]
            Build["2. Incremental / parallel build (warm frozen cone)<br/>build VerifierChallenge + Solution"]
            Check["3. Spooled export & independent kernel<br/>lean4export → comparator checks → parallel nanoda_bin"]
        end

        Score(["Accepted verdict → scripts/score.json"])
    end

    Host --> Preflight
    Preflight --> Audit
    Audit -->|"3 standard axioms"| Build
    Build -->|".olean artifacts"| Check
    Check -->|"nanoda + comparator accept"| Score`
