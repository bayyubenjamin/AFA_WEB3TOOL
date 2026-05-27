;; Math util updated 2026-05-27T19:53:32Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u38)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
