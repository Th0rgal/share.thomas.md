export const TITLE = 'boost.ci × evm.fast: Boosted Benchmark'

export const DIAGRAM = `flowchart TD
    Push["Push to ci/boost-* with [boosted-benchmark]<br/>(benchmark.yml and main untouched)"] --> Step

    subgraph Runner["GitHub runner (Blacksmith)"]
        Step["boost.ci prebuild step<br/>GitHub OIDC token · continue-on-error"]
        Summary["Job summary (non-blocking preview)<br/>claimed K, axioms, errors"]

        subgraph VM["Isolated verifier VM (offline, no secrets)"]
            Decide{"boost.ci result?"}
            Replay["Kernel replay only<br/>comparator on solution.export.zst"]
            Refute["Build only failing file F<br/>(+ its imports)"]
            Stock["Stock verifier/verify.py"]
            Verdict(["Official verdict"])
        end
    end

    subgraph Boost["boost.ci (untrusted accelerator)"]
        Work["1. Prebuild Solution (warm cache)<br/>2. Quick check (policy + YukonCheck)<br/>3. Export solution.export.zst"]
    end

    Step -->|"one request: commit SHA + submission files"| Work
    Work -.->|"① quick check, early"| Summary
    Work -.->|"② export or failing file F"| Step
    Step -->|"untrusted bundle"| Decide

    Decide -->|"ready"| Replay
    Decide -->|"compile_failed (F)"| Refute
    Decide -->|"timeout / error"| Stock

    Replay -->|"kernel accepts"| Verdict
    Replay -.->|"kernel rejects"| Stock
    Refute -->|"F fails locally"| Verdict
    Refute -.->|"F builds locally"| Stock
    Stock --> Verdict`
