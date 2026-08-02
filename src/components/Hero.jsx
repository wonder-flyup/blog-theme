import { motion, useReducedMotion } from 'motion/react'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <section className="pb-8 pt-2">
      {/* Eyebrow */}
      <motion.p
        className="mb-3 text-xs font-medium tracking-[0.15em] uppercase"
        style={{ color: 'var(--color-accent)' }}
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        animate="visible"
        custom={0}
      >
        Essays &amp; Notes
      </motion.p>

      {/* Headline */}
      <motion.h1
        className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl"
        style={{ color: 'var(--color-text-primary)' }}
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        animate="visible"
        custom={0.1}
      >
        死亡不是终点，遗忘才是
      </motion.h1>

      {/* Subtext */}
      <motion.p
        className="max-w-lg text-sm leading-relaxed md:text-base"
        style={{ color: 'var(--color-text-secondary)' }}
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        animate="visible"
        custom={0.2}
      >
        昨日风急雨骤，今宵云淡月柔
      </motion.p>

      {/* Accent line */}
      <motion.div
        className="mt-6 h-[2px] w-12 rounded-full"
        style={{ background: `linear-gradient(90deg, var(--color-accent) 0%, transparent 100%)` }}
        aria-hidden="true"
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        animate="visible"
        custom={0.3}
      />
    </section>
  )
}
