import { useMemo, useState } from "react"
import { getErrorMessage } from "../../api/errors"
import { useIsMobile } from "../../hooks/useIsMobile"
import { layout } from "../../styles/tokens"
import PageShell from "../ui/PageShell"
import s from "./AddTopics.module.css"

interface AddTopicsProps {
  onBack: () => void
  onAdd: (topics: string[]) => Promise<void> | void
}

const MAX_TOPICS = 50

export default function AddTopics({ onBack, onAdd }: AddTopicsProps) {
  const isMobile = useIsMobile()
  const [value, setValue] = useState("")
  const [added, setAdded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const lines = useMemo(
    () =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, MAX_TOPICS),
    [value],
  )

  const handleSubmit = async () => {
    if (!lines.length || added || isSubmitting) {
      return
    }

    setError("")
    setIsSubmitting(true)
    try {
      await onAdd(lines)
      setAdded(true)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Thêm chủ đề nghiên cứu"
      subtitle="Nhập một hoặc nhiều ý tưởng nội dung để đưa vào hàng đợi nghiên cứu."
      maxWidth={layout.contentWidth}
    >
      <div className={s.pageWrap}>
        <section className={s.formCard}>
          <div className={s.pageMeta}>
            <button type="button" onClick={onBack} className={s.backBtn}>
              ← Quay lại
            </button>
            <p className={s.pageHint}>Mỗi dòng là một chủ đề · tối đa {MAX_TOPICS} chủ đề.</p>
          </div>

          <div className={s.sectionsGrid}>
            <div className={s.section}>
              <div className={s.sectionHeader}>
                <span className={s.stepNumber}>1</span>
                <div>
                  <h2 className={s.sectionTitle}>Nhập chủ đề</h2>
                  <p className={s.sectionDescription}>
                    Chủ đề càng cụ thể, kết quả nghiên cứu và content brief càng hữu ích.
                  </p>
                </div>
              </div>

              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={"Nhập chủ đề, mỗi dòng một chủ đề...\n\nYamaha U3\nKawai K300\nBest piano for beginners"}
                rows={isMobile ? 8 : 9}
                className={s.textarea}
                autoFocus
              />

              <div className={s.inputMeta}>
                <span>
                  {lines.length > 0
                    ? `${lines.length} chủ đề đã nhập`
                    : "Mỗi dòng được tính là một chủ đề"}
                </span>
                <span>{lines.length}/{MAX_TOPICS} dòng</span>
              </div>
            </div>

            <div className={s.section}>
              <div className={s.previewHeader}>
                <div className={s.sectionHeader}>
                  <span className={s.stepNumber}>2</span>
                  <div>
                    <h2 className={s.sectionTitle}>Xem trước</h2>
                    <p className={s.sectionDescription}>
                      Kiểm tra nhanh danh sách trước khi thêm vào hàng đợi.
                    </p>
                  </div>
                </div>
                {lines.length > 0 && (
                  <span className={s.topicCount}>{lines.length} chủ đề</span>
                )}
              </div>

              {lines.length > 0 ? (
                <div className={s.previewList}>
                  {lines.map((topic, index) => (
                    <div className={s.previewRow} key={`${topic}-${index}`}>
                      <span className={s.rowNumber}>{index + 1}</span>
                      <span className={s.topicName}>{topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={s.emptyPreview}>
                  <strong>Chưa có chủ đề nào</strong>
                  <span>Nhập mỗi chủ đề trên một dòng để xem preview trước khi thêm vào queue.</span>
                </div>
              )}
            </div>
          </div>

          <div className={s.cardFooter}>
            {error ? <div className={s.emptyPreview}>{error}</div> : null}

            <div className={s.actions}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!lines.length || added || isSubmitting}
                className={`${s.primaryBtn} ${added ? s.successBtn : ""}`}
              >
                {added
                  ? "Đã thêm thành công"
                  : isSubmitting
                    ? "Đang thêm..."
                    : lines.length > 0
                      ? `Thêm ${lines.length} chủ đề`
                      : "Thêm chủ đề"}
              </button>

              <button type="button" onClick={onBack} className={s.cancelBtn}>
                Hủy
              </button>
            </div>

            {!isMobile && (
              <p className={s.footerNote}>
                Các chủ đề sẽ được thêm vào hàng đợi nghiên cứu và xử lý lần lượt.
              </p>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
